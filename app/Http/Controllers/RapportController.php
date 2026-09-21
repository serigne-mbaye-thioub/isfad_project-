<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use App\Models\Rapport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class RapportController extends Controller
{
    /**
     * Liste les rapports d'un projet en respectant la logique de visibilité.
     */
    public function index(Request $request, $projetId): JsonResponse
    {
        $projet = Projet::findOrFail($projetId);
        $user = $request->user();

        // On vérifie d'abord si l'utilisateur a accès au projet globalement.
        // Un membre de l'équipe (actif), ou un gestionnaire.
        // Les admins purs sans implication projet n'ont pas accès (selon consigne de l'utilisateur).
        $isGestionnaire = in_array($user->fonction, ['Gestionnaire', 'Gestionnaire de projet']);
        $participation = \App\Models\ParticipationProjet::where('id_projet', $projetId)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        // Le Chef de projet est celui défini dans ParticipationProjet avec role_projet = 'chef_projet'
        $isChefProjet = $participation && $participation->role_projet === 'chef_projet';

        // Si l'utilisateur n'est ni gestionnaire, ni participant, il ne voit rien (même pas le projet logiquement).
        if (!$isGestionnaire && !$participation) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $query = Rapport::with(['auteur:id,nom,prenom,fonction', 'destinataires:id,nom,prenom,fonction'])
            ->where('type_cible', 'projet')
            ->where('id_cible', $projetId)
            ->orderBy('created_at', 'desc');

        // Filtrage de visibilité
        if (!$isGestionnaire && !$isChefProjet) {
            // Un simple membre ne voit que ses propres rapports OU ceux où il est ciblé
            $query->where(function($q) use ($user) {
                $q->where('id_auteur', $user->id)
                  ->orWhereHas('destinataires', function($q2) use ($user) {
                      $q2->where('utilisateur_id', $user->id);
                  });
            });
        }

        return response()->json($query->get());
    }

    /**
     * Dépôt d'un nouveau rapport.
     */
    public function store(Request $request, $projetId): JsonResponse
    {
        $projet = Projet::findOrFail($projetId);
        $user = $request->user();

        // Vérifier que l'utilisateur participe au projet (les gestionnaires peuvent aussi déposer si on le permet)
        $isGestionnaire = in_array($user->fonction, ['Gestionnaire', 'Gestionnaire de projet']);
        $participation = \App\Models\ParticipationProjet::where('id_projet', $projetId)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        if (!$isGestionnaire && !$participation) {
            return response()->json(['message' => 'Accès refusé. Vous devez être membre du projet pour y déposer un rapport.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'type_rapport' => 'required|string|max:100', // Ex: compte_rendu, avancement, anomalie
            'contenu' => 'nullable|string',
            'fichier' => 'nullable|file|max:20480', // Max 20MB
            'toute_equipe' => 'boolean',
            'destinataires' => 'nullable|array',
            'destinataires.*' => 'exists:utilisateurs,id'
        ]);

        $url_export = null;
        $format_export = null;

        if ($request->hasFile('fichier')) {
            $file = $request->file('fichier');
            $url_export = $file->store('rapports_projets', 'public');
            $format_export = $file->getClientOriginalExtension();
        }

        $rapport = Rapport::create([
            'type_cible' => 'projet',
            'id_cible' => $projetId,
            'titre' => $validated['titre'],
            'type_rapport' => $validated['type_rapport'],
            'contenu' => $validated['contenu'] ?? '',
            'format_export' => $format_export,
            'url_export' => $url_export,
            'id_auteur' => $user->id,
            'est_publie' => true,
        ]);

        // Gérer les destinataires
        $destinatairesIds = [];
        if (!empty($validated['toute_equipe'])) {
            $destinatairesIds = \App\Models\ParticipationProjet::where('id_projet', $projetId)
                ->where('statut', 'actif')
                ->where('id_utilisateur', '!=', $user->id) // exclure l'auteur lui-même
                ->pluck('id_utilisateur')
                ->toArray();
        } elseif (!empty($validated['destinataires'])) {
            $destinatairesIds = array_diff($validated['destinataires'], [$user->id]);
        }

        if (count($destinatairesIds) > 0) {
            $rapport->destinataires()->sync($destinatairesIds);

            // Notifications
            foreach ($destinatairesIds as $destId) {
                $notif = \App\Models\Notification::create([
                    'type_evenement' => 'nouveau_rapport',
                    'titre'          => 'Nouveau rapport partagé',
                    'contenu'        => $user->prenom . " " . $user->nom . " a partagé un rapport avec vous : \"" . $rapport->titre . "\".",
                    'type_cible'     => 'rapport',
                    'id_cible'       => $rapport->id,
                    'id_emetteur'    => $user->id,
                ]);

                \App\Models\NotificationDestinataire::create([
                    'id_notification' => $notif->id,
                    'id_utilisateur'  => $destId,
                    'est_lue'         => false,
                ]);
            }
        }

        return response()->json($rapport->load(['auteur', 'destinataires']), 201);
    }
}
