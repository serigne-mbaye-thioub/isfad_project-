<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\TacheRaci;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    /**
     * Création d'une tâche.
     * Peut être liée soit à un projet (id_projet) soit à une activité (id_activite).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_projet' => 'nullable|exists:projets,id',
            'id_activite' => 'nullable|exists:activites,id',
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
            'date_debut' => 'required|date',
            'date_limite' => 'required|date|after_or_equal:date_debut',
            'id_responsable' => 'required|exists:utilisateurs,id',
            'id_approbateur' => 'nullable|exists:utilisateurs,id',
        ]);

        if (empty($validated['id_projet']) && empty($validated['id_activite'])) {
            return response()->json(['message' => 'Une tâche doit être obligatoirement rattachée à un projet ou à une activité.'], 422);
        }

        // Création de la tâche avec R et A
        $tache = Tache::create([
            'id_projet' => $validated['id_projet'] ?? null,
            'id_activite' => $validated['id_activite'] ?? null,
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'priorite' => $validated['priorite'] ?? 'moyenne',
            'date_debut' => $validated['date_debut'],
            'date_limite' => $validated['date_limite'],
            'id_responsable' => $validated['id_responsable'],
            'id_approbateur' => $validated['id_approbateur'] ?? null,
            'statut' => 'a_faire',
        ]);

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

        // 2. Est-il "Consulté" dans la matrice RACI ?
        $isConsulte = TacheRaci::where('id_tache', $tache->id)
                               ->where('id_utilisateur', $user->id)
                               ->where('role_raci', 'consulte')
                               ->exists();

        // 3. Est-il Administrateur global ?
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);

        if (!$isRA && !$isConsulte && !$isAdmin) {
            return response()->json([
                'message' => 'Accès non autorisé. Seuls le Responsable, l\'Approbateur ou une personne Consultée peuvent modifier le statut de cette tâche.'
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

        return response()->json($raci);
    }

    /**
     * Modifier les informations générales d'une tâche.
     */
    public function update(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);

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

        return response()->json($tache);
    }
}
