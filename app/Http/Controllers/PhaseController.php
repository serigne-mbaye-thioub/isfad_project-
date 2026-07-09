<?php

namespace App\Http\Controllers;

use App\Models\Phase;
use App\Models\Projet;
use Illuminate\Http\Request;

class PhaseController extends Controller
{
    private function peutGererPhase($user, $id_projet)
    {
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if ($user->isAdminGlobally()) {
            return true;
        }
        
        $projet = Projet::find($id_projet);
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
     * Création d'une nouvelle phase pour un projet
     */
    public function store(Request $request, $id_projet)
    {
        $projet = Projet::findOrFail($id_projet);
        
        if (!$this->peutGererPhase($request->user(), $projet->id)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|in:initialisation,planification,execution,suivi,cloture',
            'description' => 'nullable|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'ordre' => 'nullable|integer|min:1',
        ]);

        $phase = Phase::create(array_merge($validated, [
            'id_projet' => $projet->id,
            'statut' => 'en_attente',
            'avancement' => 0,
            'ordre' => $validated['ordre'] ?? Phase::where('id_projet', $projet->id)->count() + 1
        ]));

        return response()->json($phase, 201);
    }

    /**
     * Modification d'une phase
     */
    public function update(Request $request, $id)
    {
        $phase = Phase::findOrFail($id);
        
        if (!$this->peutGererPhase($request->user(), $phase->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'nom' => 'in:initialisation,planification,execution,suivi,cloture',
            'description' => 'nullable|string',
            'date_debut' => 'date',
            'date_fin' => 'date|after_or_equal:date_debut',
            'ordre' => 'integer|min:1',
        ]);

        $phase->update($validated);

        return response()->json($phase);
    }

    /**
     * Modification du statut d'une phase (Démarrer / Clôturer)
     */
    public function updateStatut(Request $request, $id)
    {
        $phase = Phase::findOrFail($id);
        
        if (!$this->peutGererPhase($request->user(), $phase->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'statut' => 'required|in:en_attente,en_cours,terminee,annulee',
        ]);

        $phase->update(['statut' => $validated['statut']]);

        return response()->json($phase);
    }
}
