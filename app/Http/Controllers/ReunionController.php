<?php

namespace App\Http\Controllers;

use App\Mail\ReunionPlanifieeMail;
use App\Models\Notification;
use App\Models\NotificationDestinataire;
use App\Models\ParticipationProjet;
use App\Models\ParticipationReunion;
use App\Models\Reunion;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ReunionController extends Controller
{
    /**
     * Liste des réunions à venir pour l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Récupère les réunions planifiées où l'utilisateur est invité ou organisateur
        $reunions = Reunion::where('statut', 'planifiee')
            ->where(function ($query) use ($user) {
                $query->where('id_organisateur', $user->id)
                      ->orWhereHas('participants', function ($q) use ($user) {
                          $q->where('id_utilisateur', $user->id);
                      });
            })
            ->with(['organisateur', 'participants', 'projet'])
            ->orderBy('date_reunion', 'asc')
            ->get();

        return response()->json($reunions);
    }

    /**
     * Liste des demandes de réunions (en_attente)
     */
    public function demandes(Request $request)
    {
        $user = $request->user();

        // Si Admin, voit toutes les demandes
        if (in_array($user->fonction, ['Administrateur', 'Administrateur système'])) {
            $demandes = Reunion::where('statut', 'en_attente')->with(['organisateur', 'projet'])->get();
            return response()->json($demandes);
        }

        // Sinon, ne voit que les demandes des projets où il est Chef de projet, Gestionnaire, ou Superviseur
        $projetsGeresIds = ParticipationProjet::where('id_utilisateur', $user->id)
            ->whereIn('role_projet', ['chef_projet', 'gestionnaire_projet', 'superviseur'])
            ->pluck('id_projet');

        $demandes = Reunion::where('statut', 'en_attente')
            ->whereIn('id_projet', $projetsGeresIds)
            ->with(['organisateur', 'projet'])
            ->get();

        return response()->json($demandes);
    }

    /**
     * Création d'une réunion (ou demande de réunion)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_projet' => 'nullable|exists:projets,id',
            'titre' => 'required|string|max:200',
            'ordre_du_jour' => 'required|string',
            'lieu' => 'nullable|string|max:300',
            'date_reunion' => 'required|date|after:now',
            'duree_minutes' => 'nullable|integer|min:1',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:utilisateurs,id',
        ]);

        $user = $request->user();

        // L'Administrateur n'a pas le droit d'organiser des réunions
        if (in_array($user->fonction, ['Administrateur', 'Administrateur système'])) {
            return response()->json(['message' => 'L\'Administrateur n\'est pas autorisé à organiser des réunions.'], 403);
        }
        
        // Déterminer le statut selon les droits
        $statut = 'en_attente';
        
        if ($validated['id_projet'] ?? false) {
            $participation = ParticipationProjet::where('id_projet', $validated['id_projet'])
                ->where('id_utilisateur', $user->id)->first();
                
            if ($participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire_projet', 'superviseur'])) {
                $statut = 'planifiee';
            }
        } elseif (in_array($user->fonction, ['Chef de projet', 'Superviseur'])) { // Profil métier général
            $statut = 'planifiee';
        }

        DB::beginTransaction();
        try {
            $reunion = Reunion::create([
                'id_projet' => $validated['id_projet'] ?? null,
                'titre' => $validated['titre'],
                'ordre_du_jour' => $validated['ordre_du_jour'],
                'lieu' => $validated['lieu'] ?? null,
                'date_reunion' => $validated['date_reunion'],
                'duree_minutes' => $validated['duree_minutes'] ?? null,
                'statut' => $statut,
                'id_organisateur' => $user->id,
            ]);

            // Attacher les participants s'il y en a
            if (!empty($validated['participants'])) {
                foreach ($validated['participants'] as $participantId) {
                    ParticipationReunion::create([
                        'id_reunion' => $reunion->id,
                        'id_utilisateur' => $participantId,
                        'statut_presence' => 'en_attente',
                    ]);
                }
            }

            // Si la réunion est directement planifiée, on envoie les notifs
            if ($statut === 'planifiee' && !empty($validated['participants'])) {
                $this->notifierParticipants($reunion, collect($validated['participants']));
            }

            DB::commit();
            return response()->json($reunion->load('participants'), 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur de création', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Valider une demande de réunion
     */
    public function valider(Request $request, $id)
    {
        $reunion = Reunion::where('statut', 'en_attente')->findOrFail($id);
        $user = $request->user();

        // Vérification des droits
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        $hasDroitsProjet = false;

        if ($reunion->id_projet) {
            $hasDroitsProjet = ParticipationProjet::where('id_projet', $reunion->id_projet)
                ->where('id_utilisateur', $user->id)
                ->whereIn('role_projet', ['chef_projet', 'gestionnaire_projet', 'superviseur'])
                ->exists();
        }

        if (!$isAdmin && !$hasDroitsProjet) {
            return response()->json(['message' => 'Accès refusé. Vous n\'avez pas les droits pour valider cette réunion.'], 403);
        }

        DB::beginTransaction();
        try {
            $reunion->statut = 'planifiee';
            $reunion->save();

            $participantsIds = $reunion->participants()->pluck('utilisateurs.id');
            if ($participantsIds->isNotEmpty()) {
                $this->notifierParticipants($reunion, $participantsIds);
            }

            DB::commit();
            return response()->json(['message' => 'Réunion validée et planifiée avec succès', 'reunion' => $reunion]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la validation'], 500);
        }
    }

    /**
     * Logique interne pour envoyer la notification (BDD + Email)
     */
    private function notifierParticipants(Reunion $reunion, $participantsIds)
    {
        // 1. Créer la notification système parent
        $notification = Notification::create([
            'type_evenement' => 'reunion_planifiee',
            'titre' => 'Nouvelle réunion planifiée : ' . $reunion->titre,
            'contenu' => 'Vous êtes convié à une réunion le ' . $reunion->date_reunion->format('d/m/Y à H:i'),
            'type_cible' => 'reunion',
            'id_cible' => $reunion->id,
            'id_emetteur' => $reunion->id_organisateur,
        ]);

        $utilisateurs = Utilisateur::whereIn('id', $participantsIds)->get();

        foreach ($utilisateurs as $user) {
            // 2. Notification In-App
            NotificationDestinataire::create([
                'id_notification' => $notification->id,
                'id_utilisateur' => $user->id,
                'est_lue' => false,
            ]);

            // 3. Envoi de l'email
            Mail::to($user->email)->send(new ReunionPlanifieeMail($reunion, $user));
        }
    }
}
