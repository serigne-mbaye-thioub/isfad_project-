<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Phase;
use Illuminate\Http\Request;

class ActiviteController extends Controller
{
    private function peutGererActivite($user, $id_projet)
    {
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if ($user->isAdminGlobally()) {
            return true;
        }
        
        $projet = \App\Models\Projet::find($id_projet);
        if ($isGlobalManager && $projet && $projet->transmis_gestionnaire) {
            return true;
        }

        $participation = \App\Models\ParticipationProjet::where('id_projet', $id_projet)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        return $participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']);
    }

    /**
     * Création d'une activité dans une phase
     */
    public function store(Request $request, $id_phase)
    {
        $phase = Phase::findOrFail($id_phase);
        
        if (!$this->peutGererActivite($request->user(), $phase->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
            'id_responsable' => 'nullable|exists:utilisateurs,id',
        ]);

        $activite = Activite::create(array_merge($validated, [
            'id_phase' => $phase->id,
            'statut' => 'a_faire',
            'avancement' => 0,
            'priorite' => $validated['priorite'] ?? 'moyenne',
        ]));

        return response()->json($activite, 201);
    }

    /**
     * Modification d'une activité
     */
    public function update(Request $request, $id)
    {
        $activite = Activite::findOrFail($id);
        $phase = $activite->phase;
        
        if (!$this->peutGererActivite($request->user(), $phase->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'date',
            'date_fin' => 'date|after_or_equal:date_debut',
            'priorite' => 'in:basse,moyenne,haute,critique',
            'id_responsable' => 'nullable|exists:utilisateurs,id',
            'statut' => 'in:a_faire,en_cours,bloquee,terminee,annulee',
        ]);

        $activite->update($validated);

        return response()->json($activite);
    }

    /**
     * Suppression d'une activité
     */
    public function destroy(Request $request, $id)
    {
        $activite = Activite::findOrFail($id);
        $phase = $activite->phase;
        
        if (!$this->peutGererActivite($request->user(), $phase->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }
        
        $activite->delete();

        return response()->json(['message' => 'Activité supprimée avec succès'], 200);
    }
}
