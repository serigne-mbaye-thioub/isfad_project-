<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use App\Models\ParticipationProjet;
use Illuminate\Http\Request;

class ProjetController extends Controller
{
    /**
     * Liste des projets.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Administrateur et Gestionnaire voient tous les projets
        if (in_array($user->fonction, ['Administrateur', 'Administrateur système', 'Gestionnaire de projet'])) {
            $projets = Projet::with(['createur', 'membres'])->get();
        } else {
            // Un utilisateur normal voit les projets où il est membre actif ou créateur
            $projets = Projet::where(function($query) use ($user) {
                $query->whereHas('participations', function($q) use ($user) {
                    $q->where('id_utilisateur', $user->id)
                      ->where('statut', 'actif');
                })->orWhere('id_createur', $user->id);
            })
            ->with(['createur', 'membres'])
            ->get();
        }

        return response()->json($projets);
    }

    /**
     * Création d'un projet.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
        ]);

        $projet = Projet::create([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'],
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'statut' => 'a_demarrer',
            'avancement' => 0,
            'id_createur' => $request->user()->id,
        ]);

        // Le créateur est automatiquement Chef de projet
        ParticipationProjet::create([
            'id_projet' => $projet->id,
            'id_utilisateur' => $request->user()->id,
            'role_projet' => 'chef_projet',
            'statut' => 'actif',
            'date_affectation' => now(),
        ]);

        return response()->json($projet->load('membres'), 201);
    }

    /**
     * Voir un projet (avec ses tâches directes et indirectes via les phases).
     */
    public function show(Request $request, $id)
    {
        $projet = Projet::with([
            'createur:id,nom,prenom,email,fonction',
            'membres:id,nom,prenom,email,fonction',
            'phases.activites.taches.responsable:id,nom,prenom',
            'phases.activites.taches.racis.utilisateur:id,nom,prenom',
        ])->findOrFail($id);

        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système', 'Gestionnaire de projet']);
        $isMembre = \App\Models\ParticipationProjet::where('id_projet', $id)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->exists();
        $isCreateur = $projet->id_createur === $user->id;

        if (!$isAdmin && !$isMembre && !$isCreateur) {
            return response()->json(['message' => 'Accès non autorisé à ce projet.'], 403);
        }

        return response()->json($projet);
    }

    /**
     * Ajouter un membre au projet.
     */
    public function addMembre(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);
        
        $validated = $request->validate([
            'id_utilisateur' => 'required|exists:utilisateurs,id',
            'role_projet' => 'required|string',
        ]);
        
        // Vérification des droits : seul l'admin ou le chef de projet peut faire ça
        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        
        $participation = ParticipationProjet::where('id_projet', $projet->id)
                                            ->where('id_utilisateur', $user->id)
                                            ->first();
                                            
        $isChef = $participation && strtolower($participation->role_projet) === 'chef_projet';

        if (!$isAdmin && !$isChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le chef de projet peut ajouter des membres.'], 403);
        }
        
        // Ajout ou mise à jour du rôle
        $nouvelleParticipation = ParticipationProjet::updateOrCreate(
            ['id_projet' => $projet->id, 'id_utilisateur' => $validated['id_utilisateur']],
            ['role_projet' => $validated['role_projet'], 'statut' => 'actif', 'date_affectation' => now()]
        );
        
        return response()->json($nouvelleParticipation, 200);
    }

    /**
     * Mise à jour des informations du projet
     */
    public function update(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'date',
            'date_fin' => 'date|after_or_equal:date_debut',
            'priorite' => 'in:basse,moyenne,haute,critique',
            'statut' => 'in:a_demarrer,en_cours,suspendu,cloture,annule,archive',
        ]);

        $projet->update($validated);

        return response()->json($projet);
    }

    /**
     * Mise à jour de l'état SPSE du projet (Transmission, prise en charge)
     */
    public function updateEtatSpse(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        $validated = $request->validate([
            'etat_spse' => 'required|in:non_transmis,transmis_spse,pris_en_charge',
        ]);

        $projet->update(['etat_spse' => $validated['etat_spse']]);

        return response()->json($projet);
    }
}
