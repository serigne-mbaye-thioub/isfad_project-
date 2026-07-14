<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use App\Models\ParticipationProjet;
use App\Models\Reunion;
use App\Models\ParticipationReunion;
use App\Models\Notification;
use App\Models\NotificationDestinataire;
use Illuminate\Http\Request;

class ProjetController extends Controller
{
    /**
     * Liste des projets.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $hasGlobalAccess = ($user->hasRole('Gestionnaire de projet') || $user->isAdminGlobally()) && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet';
        
        $query = Projet::with(['createur', 'membres']);

        if ($hasGlobalAccess) {
            $query->where(function($q) use ($user) {
                $q->where('transmis_gestionnaire', true)
                  ->orWhere('id_createur', $user->id)
                  ->orWhereHas('participations', function($sq) use ($user) {
                      $sq->where('id_utilisateur', $user->id)->where('statut', 'actif');
                  });
            });
        } elseif ($user->fonction === 'Architecte' || $user->fonction === 'Architecte de projet') {
            $query->where('id_createur', $user->id)->whereNotIn('statut', ['archive', 'annule']);
        } else {
            $query->where(function($q) use ($user) {
                $q->whereHas('participations', function($sq) use ($user) {
                    $sq->where('id_utilisateur', $user->id)->where('statut', 'actif');
                })->orWhere('id_createur', $user->id);
            })->whereNotIn('statut', ['archive', 'annule']);
        }

        $projets = $query->orderByRaw("
            CASE priorite 
                WHEN 'critique' THEN 1 
                WHEN 'haute' THEN 2 
                WHEN 'moyenne' THEN 3 
                WHEN 'basse' THEN 4 
                ELSE 5 
            END
        ")->orderBy('created_at', 'desc')->get();

        return response()->json($projets);
    }

    /**
     * Création d'un projet.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $allowedRoles = ['Architecte', 'Architecte de projet', 'Gestionnaire', 'Gestionnaire de projet', 'Chef de projet', 'Administrateur', 'Administrateur système'];
        
        if (!in_array($user->fonction, $allowedRoles)) {
            return response()->json(['message' => 'Vous n\'avez pas les droits pour initialiser un projet.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fiche_projet' => 'nullable|string',
            'fichier' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
            'equipe' => 'nullable|array',
            'equipe.*.id_utilisateur' => 'required_with:equipe|exists:utilisateurs,id',
            'equipe.*.role_projet' => 'required_with:equipe|string|in:partenaire,architecte,chef_projet,superviseur,gestionnaire,admin,membre',
            'id_chef_projet' => 'required|exists:utilisateurs,id',
            'create_kickoff' => 'nullable|boolean',
            'reunion_date' => 'nullable|required_if:create_kickoff,true|date',
            'reunion_heure' => 'nullable|required_if:create_kickoff,true|date_format:H:i',
            'reunion_lieu' => 'nullable|string|max:255',
            'reunion_duree' => 'nullable|integer|min:15',
            'id_projet_initial' => 'nullable|exists:projets,id',
            'participants_reunion' => 'nullable|array',
            'participants_reunion.*' => 'exists:utilisateurs,id',
        ]);

        $path = null;
        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('fiches_projets', 'public');
        }

        if (!empty($validated['id_projet_initial'])) {
            $projet = Projet::findOrFail($validated['id_projet_initial']);
            $projet->update([
                'titre' => $validated['titre'],
                'description' => $validated['description'] ?? null,
                'fiche_projet' => $validated['fiche_projet'] ?? null,
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'] ?? null,
                'priorite' => $validated['priorite'] ?? 'moyenne',
                'statut' => 'en_cours',
                'transmis_gestionnaire' => true,
            ]);
            if ($path) {
                $projet->update(['fiche_fichier' => $path]);
            }
        } else {
            $projet = Projet::create([
                'titre' => $validated['titre'],
                'description' => $validated['description'] ?? null,
                'fiche_projet' => $validated['fiche_projet'] ?? null,
                'fiche_fichier' => $path,
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'] ?? null,
                'priorite' => $validated['priorite'] ?? 'moyenne',
                'statut' => 'en_cours',
                'avancement' => 0,
                'id_createur' => $user->id,
                'transmis_gestionnaire' => true,
            ]);
        }

        // Déterminer le rôle du créateur dans le projet
        $roleCreateur = null;
        if (in_array($user->fonction, ['Architecte', 'Architecte de projet', 'Administrateur', 'Administrateur système'])) {
            $roleCreateur = 'architecte';
        } elseif (in_array($user->fonction, ['Gestionnaire', 'Gestionnaire de projet'])) {
            $roleCreateur = 'gestionnaire';
        } elseif ($user->fonction === 'Chef de projet') {
            $roleCreateur = 'chef_projet';
        }

        // Eviter le doublon si le créateur se désigne lui-même comme chef de projet principal
        $isCreatorAlsoDesignatedChef = ($user->id == $validated['id_chef_projet']);

        if (!$isCreatorAlsoDesignatedChef && $roleCreateur) {
            ParticipationProjet::create([
                'id_projet' => $projet->id,
                'id_utilisateur' => $user->id,
                'role_projet' => $roleCreateur,
                'statut' => 'actif',
                'date_affectation' => now(),
            ]);
        }

        // Le Chef de projet désigné est ajouté (ou mis à jour s'il existe déjà via la transmission)
        ParticipationProjet::updateOrCreate(
            ['id_projet' => $projet->id, 'id_utilisateur' => $validated['id_chef_projet']],
            ['role_projet' => 'chef_projet', 'statut' => 'actif', 'date_affectation' => now()]
        );

        // Ajout des membres de l'équipe (s'il y en a)
        if (!empty($validated['equipe'])) {
            foreach ($validated['equipe'] as $membre) {
                // On évite d'écraser le chef de projet
                if ($membre['id_utilisateur'] == $validated['id_chef_projet']) {
                    continue;
                }
                ParticipationProjet::updateOrCreate(
                    ['id_projet' => $projet->id, 'id_utilisateur' => $membre['id_utilisateur']],
                    ['role_projet' => $membre['role_projet'], 'statut' => 'actif', 'date_affectation' => now()]
                );
            }
        }

        // --- GESTION DE LA RÉUNION DE DÉMARRAGE ---
        if (!empty($validated['create_kickoff']) && $validated['create_kickoff']) {
            $dateHeureReunion = $validated['reunion_date'] . ' ' . $validated['reunion_heure'] . ':00';
            
            $reunion = Reunion::create([
                'id_projet' => $projet->id,
                'titre' => 'Réunion de démarrage : ' . $projet->titre,
                'ordre_du_jour' => "Présentation du projet, des objectifs et de l'équipe.",
                'lieu' => $validated['reunion_lieu'] ?? 'À définir',
                'date_reunion' => $dateHeureReunion,
                'duree_minutes' => $validated['reunion_duree'] ?? 60,
                'statut' => 'planifiee',
                'id_organisateur' => $user->id,
            ]);

            // Ajout des participants à la réunion
            ParticipationReunion::create([
                'id_reunion' => $reunion->id,
                'id_utilisateur' => $user->id,
                'statut_presence' => 'accepte', // L'organisateur accepte par défaut
            ]);

            if (!$isCreatorAlsoDesignatedChef) {
                ParticipationReunion::create([
                    'id_reunion' => $reunion->id,
                    'id_utilisateur' => $validated['id_chef_projet'],
                    'statut_presence' => 'en_attente',
                ]);

                // Notification pour le Chef de projet
                $notif = Notification::create([
                    'type_evenement' => 'reunion',
                    'titre' => 'Invitation à la réunion de démarrage',
                    'contenu' => "Vous êtes convié à la réunion de démarrage du projet '{$projet->titre}'.",
                    'type_cible' => 'reunion',
                    'id_cible' => $reunion->id,
                    'id_emetteur' => $user->id,
                ]);

                NotificationDestinataire::create([
                    'id_notification' => $notif->id,
                    'id_utilisateur' => $validated['id_chef_projet'],
                    'est_lue' => false,
                ]);
            }

            // Ajout des participants additionnels
            if (!empty($validated['participants_reunion'])) {
                foreach ($validated['participants_reunion'] as $participantId) {
                    if ($participantId == $user->id || $participantId == $validated['id_chef_projet']) {
                        continue; // Déjà ajouté plus haut
                    }

                    // 1. L'ajouter à la réunion
                    ParticipationReunion::create([
                        'id_reunion' => $reunion->id,
                        'id_utilisateur' => $participantId,
                        'statut_presence' => 'en_attente',
                    ]);

                    // 2. L'ajouter en tant que membre au projet (s'il n'y est pas)
                    ParticipationProjet::firstOrCreate(
                        ['id_projet' => $projet->id, 'id_utilisateur' => $participantId],
                        ['role_projet' => 'membre', 'statut' => 'actif', 'date_affectation' => now()]
                    );

                    // 3. Lui envoyer une notification pour la réunion
                    $notifMembre = Notification::create([
                        'type_evenement' => 'reunion',
                        'titre' => 'Invitation à la réunion de démarrage',
                        'contenu' => "Vous êtes convié à la réunion de démarrage du projet '{$projet->titre}'.",
                        'type_cible' => 'reunion',
                        'id_cible' => $reunion->id,
                        'id_emetteur' => $user->id,
                    ]);

                    NotificationDestinataire::create([
                        'id_notification' => $notifMembre->id,
                        'id_utilisateur' => $participantId,
                        'est_lue' => false,
                    ]);
                }
            }
        }

        return response()->json($projet->load('membres'), 201);
    }

    /**
     * Initiation d'un projet par l'Architecte.
     */
    public function initier(Request $request)
    {
        $user = $request->user();
        if ($user->fonction !== 'Architecte' && $user->fonction !== 'Architecte de projet') {
            return response()->json(['message' => 'Seul un Architecte peut initier un projet.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:200',
            'description' => 'required|string',
            'objectif' => 'nullable|string',
            'division' => 'required|string',
            'partenaire' => 'nullable|string',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'priorite' => 'required|in:basse,moyenne,haute,critique',
        ]);

        $projet = Projet::create(array_merge($validated, [
            'id_createur' => $user->id,
            'statut' => 'initie',
            'avancement' => 0
        ]));

        // L'architecte est ajouté comme participant
        ParticipationProjet::create([
            'id_projet' => $projet->id,
            'id_utilisateur' => $user->id,
            'role_projet' => 'architecte',
            'statut' => 'actif',
            'date_affectation' => now(),
        ]);

        return response()->json($projet, 201);
    }

    /**
     * Transmission de la fiche projet au Chef de projet par l'Architecte.
     */
    public function transmettreChef(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);
        $user = $request->user();

        if ($projet->id_createur !== $user->id || $projet->statut !== 'initie') {
            $msg = 'Vous ne pouvez transmettre que vos projets initiés.';
            Notification::create([
                'type_evenement' => 'alerte',
                'titre' => 'Échec de transmission',
                'contenu' => $msg,
                'type_cible' => 'projet',
                'id_cible' => $projet->id,
            ])->destinataires()->create(['id_utilisateur' => $user->id]);
            return response()->json(['message' => $msg], 403);
        }

        $validated = $request->validate([
            'id_chef_projet' => 'required|exists:utilisateurs,id',
            'titre' => 'required|string|max:200',
            'objectif' => 'nullable|string',
            'description' => 'nullable|string',
            'fiche_projet' => 'nullable|string', // CKEditor HTML
            'fiche_fichier' => 'nullable|file|mimes:pdf,doc,docx|max:10240' // 10MB max
        ]);

        $chef = \App\Models\Utilisateur::find($validated['id_chef_projet']);
        if ($chef && strtolower($chef->fonction) !== 'chef de projet') {
            $msg = 'L\'utilisateur assigné doit avoir la fonction "Chef de projet".';
            Notification::create([
                'type_evenement' => 'alerte',
                'titre' => 'Échec de transmission',
                'contenu' => $msg,
                'type_cible' => 'projet',
                'id_cible' => $projet->id,
            ])->destinataires()->create(['id_utilisateur' => $user->id]);
            return response()->json(['message' => $msg], 422);
        }

        $updateData = [
            'titre' => $validated['titre'],
            'objectif' => $validated['objectif'] ?? $projet->objectif,
            'description' => $validated['description'] ?? $projet->description,
            'statut' => 'transmis_chef'
        ];

        if (isset($validated['fiche_projet'])) {
            $updateData['fiche_projet'] = $validated['fiche_projet'];
        }

        if ($request->hasFile('fiche_fichier')) {
            $path = $request->file('fiche_fichier')->store('fiches_projet', 'public');
            $updateData['fiche_fichier'] = $path;
        }

        $projet->update($updateData);

        // Assigner le chef de projet
        ParticipationProjet::create([
            'id_projet' => $projet->id,
            'id_utilisateur' => $validated['id_chef_projet'],
            'role_projet' => 'chef_projet',
            'statut' => 'actif',
            'date_affectation' => now(),
        ]);

        // Notification au Chef de projet
        Notification::create([
            'type_evenement' => 'projet_transmis',
            'titre' => 'Nouveau projet transmis',
            'contenu' => $user->prenom . ' ' . $user->nom . ' vous a transmis la fiche du projet : ' . $projet->titre,
            'type_cible' => 'projet',
            'id_cible' => $projet->id,
            'id_emetteur' => $user->id,
        ])->destinataires()->create(['id_utilisateur' => $validated['id_chef_projet']]);

        // Notification de succès pour l'Architecte (lui-même)
        Notification::create([
            'type_evenement' => 'succes',
            'titre' => 'Transmission réussie',
            'contenu' => 'Le projet ' . $projet->titre . ' a été transmis avec succès au chef de projet.',
            'type_cible' => 'projet',
            'id_cible' => $projet->id,
            'id_emetteur' => null,
        ])->destinataires()->create(['id_utilisateur' => $user->id]);

        return response()->json($projet);
    }

    /**
     * Voir un projet (avec ses tâches directes et indirectes via les phases).
     */
    public function show(Request $request, $id)
    {
        $projet = Projet::with([
            'createur:id,nom,prenom,email,fonction',
            'membres:id,nom,prenom,email,fonction',
            'phases',
            'taches.responsable:id,nom,prenom',
            'taches.approbateur:id,nom,prenom',
            'taches.racis.utilisateur:id,nom,prenom',
            'activites.taches.responsable:id,nom,prenom',
            'activites.taches.approbateur:id,nom,prenom',
            'activites.taches.racis.utilisateur:id,nom,prenom',
            'jalons.activites.taches.responsable:id,nom,prenom',
            'jalons.activites.taches.approbateur:id,nom,prenom',
            'jalons.activites.taches.racis.utilisateur:id,nom,prenom',
            'phases.jalons.activites.taches.responsable:id,nom,prenom',
            'phases.jalons.activites.taches.approbateur:id,nom,prenom',
            'phases.jalons.activites.taches.racis.utilisateur:id,nom,prenom',
            'phases.activites.taches.responsable:id,nom,prenom',
            'phases.activites.taches.approbateur:id,nom,prenom',
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

        if (in_array($projet->statut, ['archive', 'annule']) && !$hasGlobalAccess) {
            $statusLabel = $projet->statut === 'archive' ? 'archivé' : 'annulé';
            return response()->json(['message' => "Ce projet est $statusLabel. Seul le Gestionnaire peut y accéder."], 403);
        }

        // Si c'est juste un membre normal (pas chef, ni gestionnaire, ni admin),
        // on ne lui renvoie que les tâches où il est impliqué (R ou dans RACI).
        if (!$isChefOrMore && !$isCreateur) {
            $filterTaches = function($taches) use ($user) {
                return $taches->filter(function($tache) use ($user) {
                    return $tache->id_responsable === $user->id || 
                           $tache->id_approbateur === $user->id ||
                           $tache->racis->contains('id_utilisateur', $user->id);
                })->values();
            };

            if ($projet->taches) {
                $projet->setRelation('taches', $filterTaches($projet->taches));
            }
            if ($projet->activites) {
                foreach ($projet->activites as $activite) {
                    $activite->setRelation('taches', $filterTaches($activite->taches));
                }
            }
            if ($projet->jalons) {
                foreach ($projet->jalons as $jalon) {
                    foreach ($jalon->activites as $activite) {
                        $activite->setRelation('taches', $filterTaches($activite->taches));
                    }
                }
            }
            if ($projet->phases) {
                foreach ($projet->phases as $phase) {
                    foreach ($phase->activites as $activite) {
                        $activite->setRelation('taches', $filterTaches($activite->taches));
                    }
                    foreach ($phase->jalons as $jalon) {
                        foreach ($jalon->activites as $activite) {
                            $activite->setRelation('taches', $filterTaches($activite->taches));
                        }
                    }
                }
            }
        }

        return response()->json($projet);
    }

    /**
     * Archiver ou désarchiver un projet.
     * Réservé au gestionnaire ou admin.
     */
    public function archiver(Request $request, $id)
    {
        $user = $request->user();
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') || $user->isAdminGlobally()) && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet';

        if (!$isGlobalManager) {
            return response()->json(['message' => 'Non autorisé. Seul le Gestionnaire peut archiver ou désarchiver un projet.'], 403);
        }

        $projet = Projet::findOrFail($id);
        
        $nouveauStatut = $projet->statut === 'archive' ? 'cloture' : 'archive';
        $projet->update(['statut' => $nouveauStatut]);

        return response()->json([
            'message' => $nouveauStatut === 'archive' ? 'Projet archivé avec succès.' : 'Projet désarchivé avec succès.',
            'projet' => $projet
        ]);
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
        
        // Notification au nouveau membre (s'il ne s'ajoute pas lui-même)
        if ($validated['id_utilisateur'] != $user->id) {
            $notifMembre = Notification::create([
                'type_evenement' => 'projet',
                'titre' => 'Ajout à une équipe projet',
                'contenu' => "Vous avez été ajouté à l'équipe du projet '{$projet->titre}' en tant que {$validated['role_projet']}.",
                'type_cible' => 'projet',
                'id_cible' => $projet->id,
                'id_emetteur' => $user->id,
            ]);

            NotificationDestinataire::create([
                'id_notification' => $notifMembre->id,
                'id_utilisateur' => $validated['id_utilisateur'],
                'est_lue' => false,
            ]);
        }
        
        return response()->json($nouvelleParticipation, 200);
    }

    /**
     * Mise à jour des informations du projet
     */
    public function update(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        $user = $request->user();
        $hasGlobalAccess = $user->isAdminGlobally() || in_array($user->fonction, ['Gestionnaire', 'Gestionnaire de projet', 'Superviseur']);
        
        $participation = ParticipationProjet::where('id_projet', $projet->id)
                                            ->where('id_utilisateur', $user->id)
                                            ->first();
                                            
        $isManagerOrChef = $participation && in_array(strtolower($participation->role_projet), ['chef_projet', 'gestionnaire', 'architecte']);

        if (!$hasGlobalAccess && !$isManagerOrChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire ou Chef de projet peut modifier ce projet.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'string|max:200',
            'objectif' => 'nullable|string',
            'division' => 'nullable|string',
            'description' => 'nullable|string',
            'date_debut' => 'date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'priorite' => 'in:basse,moyenne,haute,critique',
            'statut' => 'in:initie,transmis_chef,a_demarrer,en_cours,suspendu,cloture,annule,archive',
        ]);

        // Machine d'états pour le statut
        if (isset($validated['statut']) && $validated['statut'] !== $projet->statut) {
            $allowedTransitions = [
                'initie' => ['transmis_chef', 'annule'],
                'transmis_chef' => ['a_demarrer', 'annule'],
                'a_demarrer' => ['en_cours', 'annule'],
                'en_cours' => ['suspendu', 'cloture', 'annule'],
                'suspendu' => ['en_cours', 'cloture', 'annule'],
                'cloture' => ['archive', 'en_cours'],
                'annule' => ['initie', 'a_demarrer'],
                'archive' => ['cloture']
            ];
            
            if (!isset($allowedTransitions[$projet->statut]) || !in_array($validated['statut'], $allowedTransitions[$projet->statut])) {
                return response()->json(['message' => 'Transition de statut invalide de '.$projet->statut.' vers '.$validated['statut']], 422);
            }
        }

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
