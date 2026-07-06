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
        
        // Le Superviseur et Gestionnaire voient TOUS les projets TRANSMIS (ou dont ils sont créateurs/membres)
        // Mais ATTENTION: 'Chef de projet' hérite de 'Gestionnaire' dans Utilisateur.php, 
        // donc on doit exclure explicitement le 'Chef de projet' (et l'Architecte) de la vision globale.
        if (($user->hasRole('Gestionnaire de projet') || $user->isAdminGlobally()) && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet') {
            $projets = Projet::where('transmis_gestionnaire', true)
                ->orWhere('id_createur', $user->id)
                ->orWhereHas('participations', function($q) use ($user) {
                    $q->where('id_utilisateur', $user->id)->where('statut', 'actif');
                })
                ->with(['createur', 'membres'])
                ->get();
        } else {
            // Tous les autres (y compris Chef de projet et Architecte) ne voient que leurs projets
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
        $user = $request->user();
        // Seul l'Architecte (ou Admin) peut créer (ou ceux héritant si applicable)
        if (!$user->isAdminGlobally() && $user->fonction !== 'Architecte de projet') {
            return response()->json(['message' => 'Seul l\'Architecte de projet ou l\'Administrateur peut initialiser un projet.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'fiche_projet' => 'nullable|string',
            'fichier' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
            'id_chef_projet' => 'required|exists:utilisateurs,id',
        ]);

        $path = null;
        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('fiches_projets', 'public');
        }

        $projet = Projet::create([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'fiche_projet' => $validated['fiche_projet'] ?? null,
            'fiche_fichier' => $path,
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'],
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'statut' => 'a_demarrer',
            'avancement' => 0,
            'id_createur' => $user->id,
            'transmis_gestionnaire' => false,
        ]);

        // L'Architecte est ajouté comme architecte
        ParticipationProjet::create([
            'id_projet' => $projet->id,
            'id_utilisateur' => $user->id,
            'role_projet' => 'architecte',
            'statut' => 'actif',
            'date_affectation' => now(),
        ]);

        // Le Chef de projet désigné est ajouté
        ParticipationProjet::create([
            'id_projet' => $projet->id,
            'id_utilisateur' => $validated['id_chef_projet'],
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
        // Accès global pour le Gestionnaire (et héritiers) ou Admin
        $hasGlobalAccess = $user->hasRole('Gestionnaire de projet') || $user->isAdminGlobally();
        $participation = \App\Models\ParticipationProjet::where('id_projet', $id)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();
        
        $isMembre = $participation !== null;
        $isChefOrMore = $hasGlobalAccess || ($isMembre && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']));
        $isCreateur = $projet->id_createur === $user->id;

        if (!$hasGlobalAccess && !$isMembre && !$isCreateur) {
            return response()->json(['message' => 'Accès non autorisé à ce projet.'], 403);
        }

        // Si c'est juste un membre normal (pas chef, ni gestionnaire, ni admin), 
        // on ne lui renvoie que les tâches où il est impliqué (R ou dans RACI).
        if (!$isChefOrMore && !$isCreateur && $projet->phases) {
            foreach ($projet->phases as $phase) {
                foreach ($phase->activites as $activite) {
                    $activite->setRelation('taches', $activite->taches->filter(function($tache) use ($user) {
                        return $tache->id_responsable === $user->id || 
                               $tache->id_approbateur === $user->id ||
                               $tache->racis->contains('id_utilisateur', $user->id);
                    })->values());
                }
            }
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
        
        // Vérification des droits : Administrateur, ou globalement Gestionnaire, ou Chef sur ce projet
        $user = $request->user();
        $hasGlobalAccess = $user->isAdminGlobally() || $user->hasRole('Gestionnaire de projet');
        
        $participation = ParticipationProjet::where('id_projet', $projet->id)
                                            ->where('id_utilisateur', $user->id)
                                            ->first();
                                            
        $isChef = $participation && strtolower($participation->role_projet) === 'chef_projet';

        if (!$hasGlobalAccess && !$isChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire ou Chef de projet peut ajouter des membres.'], 403);
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

        $user = $request->user();
        $hasGlobalAccess = $user->isAdminGlobally() || $user->hasRole('Gestionnaire de projet');
        
        $participation = ParticipationProjet::where('id_projet', $projet->id)
                                            ->where('id_utilisateur', $user->id)
                                            ->first();
                                            
        $isChef = $participation && strtolower($participation->role_projet) === 'chef_projet';

        if (!$hasGlobalAccess && !$isChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire ou Chef de projet peut modifier ce projet.'], 403);
        }

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

        $user = $request->user();
        if (!$user->isAdminGlobally() && !$user->hasRole('Gestionnaire de projet')) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire peut modifier l\'état SPSE.'], 403);
        }

        $validated = $request->validate([
            'etat_spse' => 'required|in:non_transmis,transmis_spse,pris_en_charge',
        ]);

        $projet->update(['etat_spse' => $validated['etat_spse']]);

        return response()->json($projet);
    }
    public function transmettre(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);
        
        $user = $request->user();
        $participation = ParticipationProjet::where('id_projet', $projet->id)
                                            ->where('id_utilisateur', $user->id)
                                            ->first();
                                            
        $isChef = $participation && strtolower($participation->role_projet) === 'chef_projet';

        if (!$user->isAdminGlobally() && !$isChef) {
            return response()->json(['message' => 'Seul le Chef de projet peut transmettre ce projet au gestionnaire.'], 403);
        }

        $projet->update(['transmis_gestionnaire' => true]);

        return response()->json(['message' => 'Projet transmis au gestionnaire avec succès', 'projet' => $projet]);
    }
}
