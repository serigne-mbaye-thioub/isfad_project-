<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\TacheRaci;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    /**
     * Récupère toutes les tâches dont l'utilisateur connecté est le responsable.
     */
    public function mesTaches(Request $request)
    {
        $user = $request->user();
        
        $taches = Tache::with([
            'projet:id,titre',
            'activite:id,titre,id_phase,id_jalon,id_projet',
            'activite.phase:id,nom',
            'activite.jalon:id,titre',
            'activite.projet:id,titre',
            'responsable:id,nom,prenom',
            'approbateur:id,nom,prenom'
        ])
        ->where(function($query) use ($user) {
            $query->where('id_responsable', $user->id)
                  ->orWhere('id_approbateur', $user->id)
                  ->orWhereHas('racis', function($q) use ($user) {
                      $q->where('id_utilisateur', $user->id);
                  });
        })
        ->whereNotIn('statut', ['archivee']) // On exclut éventuellement les tâches archivées
        ->orderBy('date_limite', 'asc')
        ->get();

        return response()->json($taches);
    }

    /**
     * Vérifie si un utilisateur a le droit de créer/modifier des tâches pour un projet/activité.
     */
    private function peutGererTache($user, $id_projet, $id_activite = null)
    {
        if ($user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet')) {
            return true; // Accès global
        }

        if (!$id_projet && $id_activite) {
            $activite = \App\Models\Activite::with('phase')->find($id_activite);
            if ($activite) {
                $id_projet = $activite->id_projet ?? $activite->phase?->id_projet;
                if ($activite->id_responsable === $user->id) return true;
            }
        }

        if ($id_projet) {
            $participation = \App\Models\ParticipationProjet::where('id_projet', $id_projet)
                ->where('id_utilisateur', $user->id)
                ->where('statut', 'actif')
                ->first();
            if ($participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte'])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Création d'une tâche.
     * Peut être liée soit à un projet (id_projet) soit à une activité (id_activite).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_projet'      => 'nullable|exists:projets,id',
            'id_activite'    => 'nullable|exists:activites,id',
            'titre'          => 'required|string|max:200',
            'description'    => 'nullable|string',
            'priorite'       => 'nullable|in:basse,moyenne,haute,critique',
            'date_debut'     => 'nullable|date',
            'date_limite'    => 'required|date|after_or_equal:date_debut',
            'id_responsable' => 'nullable|exists:utilisateurs,id',
            'id_approbateur' => 'nullable|exists:utilisateurs,id',
            'consultes'      => 'nullable|array',
            'consultes.*'    => 'exists:utilisateurs,id',
            'informes'       => 'nullable|array',
            'informes.*'     => 'exists:utilisateurs,id',
        ]);

        if (empty($validated['id_projet']) && empty($validated['id_activite'])) {
            return response()->json(['message' => 'Une tâche doit être rattachée à un projet ou à une activité.'], 422);
        }

        if (!$this->peutGererTache($request->user(), $validated['id_projet'] ?? null, $validated['id_activite'] ?? null)) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Chef de projet, Gestionnaire, ou Responsable d\'activité peut créer une tâche.'], 403);
        }

        $tache = Tache::create([
            'id_projet'      => $validated['id_projet'] ?? null,
            'id_activite'    => $validated['id_activite'] ?? null,
            'titre'          => $validated['titre'],
            'description'    => $validated['description'] ?? null,
            'priorite'       => $validated['priorite'] ?? 'moyenne',
            'date_debut'     => $validated['date_debut'] ?? now()->toDateString(),
            'date_limite'    => $validated['date_limite'],
            'id_responsable' => $validated['id_responsable'] ?? $request->user()->id,
            'id_approbateur' => $validated['id_approbateur'] ?? null,
            'statut'         => 'a_faire',
        ]);

        if (!empty($validated['consultes'])) {
            foreach ($validated['consultes'] as $c) {
                TacheRaci::create(['id_tache' => $tache->id, 'id_utilisateur' => $c, 'role_raci' => 'consulte']);
            }
        }
        if (!empty($validated['informes'])) {
            foreach ($validated['informes'] as $i) {
                TacheRaci::create(['id_tache' => $tache->id, 'id_utilisateur' => $i, 'role_raci' => 'informe']);
            }
        }

        $this->ensureUsersInProject($tache, array_merge($validated['consultes'] ?? [], $validated['informes'] ?? []));

        // Envoi des notifications
        $utilisateursANotifier = collect([
            $tache->id_responsable => 'Responsable (R)',
            $tache->id_approbateur => 'Approbateur (A)'
        ])->filter(function($role, $id) use ($request) {
            return $id && $id != $request->user()->id; // Ne pas se notifier soi-même
        });

        if (!empty($validated['consultes'])) {
            foreach ($validated['consultes'] as $c) {
                if ($c != $request->user()->id) $utilisateursANotifier->put($c, 'Consulté (C)');
            }
        }
        if (!empty($validated['informes'])) {
            foreach ($validated['informes'] as $i) {
                if ($i != $request->user()->id) $utilisateursANotifier->put($i, 'Informé (I)');
            }
        }

        $idProjetLien = $tache->id_projet ?? $tache->activite?->id_projet ?? $tache->activite?->phase?->id_projet;

        foreach ($utilisateursANotifier as $idUser => $roleInfo) {
            $notifTache = \App\Models\Notification::create([
                'type_evenement' => 'tache',
                'titre' => 'Nouvelle tâche assignée',
                'contenu' => "Vous avez été désigné comme {$roleInfo} pour la tâche '{$tache->titre}'.",
                'type_cible' => 'projet', // On lie au projet pour que le bouton "Voir le projet" fonctionne
                'id_cible' => $idProjetLien,
                'id_emetteur' => $request->user()->id,
            ]);

            \App\Models\NotificationDestinataire::create([
                'id_notification' => $notifTache->id,
                'id_utilisateur' => $idUser,
                'est_lue' => false,
            ]);
        }

        return response()->json($tache, 201);
    }

    /**
     * Mettre à jour le statut d'une tâche.
     * Le Responsable, l'Approbateur, et tout utilisateur "Consulté" peuvent modifier le statut.
     */
    public function updateStatut(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);
        
        $validated = $request->validate([
            'statut' => 'required|in:a_faire,en_cours,en_revision,terminee,archivee'
        ]);

        $user = $request->user();

        // 1. Est-il Responsable ou Approbateur de la tâche ?
        $isRA = ($tache->id_responsable === $user->id) || ($tache->id_approbateur === $user->id);

        // 2. Est-il manager du projet (Admin, Gestionnaire, Chef de projet) ?
        $idProjet = $tache->id_projet ?? $tache->activite?->phase?->id_projet ?? $tache->activite?->id_projet;
        $isManager = false;
        
        if ($idProjet) {
            $projet = \App\Models\Projet::find($idProjet);
            if ($projet) {
                $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
                $hasGlobalAccess = $user->isAdminGlobally() || ($isGlobalManager && $projet->transmis_gestionnaire);
                
                $participation = \App\Models\ParticipationProjet::where('id_projet', $projet->id)
                    ->where('id_utilisateur', $user->id)
                    ->where('statut', 'actif')
                    ->first();
                
                $isManager = $hasGlobalAccess || ($participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']));
            }
        }

        if (!$isRA && !$isManager) {
            return response()->json([
                'message' => 'Accès non autorisé. Seuls le Responsable, l\'Approbateur ou le gestionnaire du projet peuvent modifier le statut de cette tâche. Les consultés et informés sont en lecture seule.'
            ], 403);
        }

        $tache->statut = $validated['statut'];
        
        // Logique de clôture : on renseigne la date et on calcule le retard
        if (in_array($validated['statut'], ['terminee', 'archivee']) && !$tache->date_cloture) {
            $tache->date_cloture = now();
            // Calcul du retard en jours (négatif = en retard)
            $diff = now()->startOfDay()->diffInDays($tache->date_limite, false);
            if ($diff < 0) {
                $tache->retard_jours = abs((int) $diff);
            } else {
                $tache->retard_jours = 0;
            }
        }

        $tache->save();

        // Recalcul de l'avancement automatique
        $avancementService = new \App\Services\AvancementService();
        if ($tache->id_activite) {
            $avancementService->recalculerAvancementCascade($tache->id_activite, null);
        } elseif ($tache->id_projet) {
            $avancementService->recalculerAvancementCascade(null, $tache->id_projet);
        }

        return response()->json($tache);
    }

    /**
     * Assigner des rôles RACI (Consulté 'C' ou Informé 'I').
     */
    public function assignRaci(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);

        $validated = $request->validate([
            'id_utilisateur' => 'required|exists:utilisateurs,id',
            'role_raci' => 'required|in:consulte,informe', // R et A sont gérés sur la tâche elle-même
        ]);

        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        $isResponsable = ($tache->id_responsable === $user->id);
        
        if (!$isAdmin && !$isResponsable) {
            return response()->json(['message' => 'Non autorisé. Seul le Responsable de la tâche ou un Administrateur peut assigner les rôles Consulté/Informé.'], 403);
        }

        $raci = TacheRaci::updateOrCreate(
            ['id_tache' => $tache->id, 'id_utilisateur' => $validated['id_utilisateur']],
            ['role_raci' => $validated['role_raci']]
        );

        $this->ensureUsersInProject($tache, [$validated['id_utilisateur']]);

        return response()->json($raci);
    }

    /**
     * Modifier les informations générales d'une tâche.
     */
    public function update(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);

        if (!$this->peutGererTache($request->user(), $tache->id_projet, $tache->id_activite)) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Chef de projet, Gestionnaire, ou Responsable d\'activité peut modifier les informations de cette tâche.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'string|max:200',
            'description' => 'nullable|string',
            'priorite' => 'in:basse,moyenne,haute,critique',
            'date_debut' => 'date',
            'date_limite' => 'date|after_or_equal:date_debut',
            'id_responsable' => 'exists:utilisateurs,id',
            'id_approbateur' => 'nullable|exists:utilisateurs,id',
        ]);

        $tache->update($validated);

        $this->ensureUsersInProject($tache);

        return response()->json($tache);
    }

    /**
     * S'assurer que les utilisateurs liés à une tâche (Responsable, Approbateur, Consultés, Informés)
     * sont bien ajoutés en tant que membre du projet pour qu'ils puissent voir la tâche et le projet.
     */
    private function ensureUsersInProject($tache, $additionalUserIds = [])
    {
        $idProjet = $tache->id_projet;
        if (!$idProjet && $tache->id_activite) {
            $activite = \App\Models\Activite::with('phase')->find($tache->id_activite);
            if ($activite) {
                $idProjet = $activite->id_projet ?? $activite->phase?->id_projet;
            }
        }

        if ($idProjet) {
            $userIds = array_filter(array_merge(
                [$tache->id_responsable, $tache->id_approbateur],
                $additionalUserIds
            ));
            $userIds = array_unique($userIds);

            foreach ($userIds as $uid) {
                \App\Models\ParticipationProjet::firstOrCreate(
                    ['id_projet' => $idProjet, 'id_utilisateur' => $uid],
                    ['role_projet' => 'membre', 'statut' => 'actif', 'date_affectation' => now()]
                );
            }
        }
    }
}
