<?php

namespace App\Http\Controllers;

use App\Models\Phase;
use App\Models\Projet;
use Illuminate\Http\Request;

class PhaseController extends Controller
{
    /**
     * Création d'une nouvelle phase pour un projet
     */
    public function store(Request $request, $id_projet)
    {
        $projet = Projet::findOrFail($id_projet);

        $validated = $request->validate([
            'nom' => 'required|string|max:100',
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

        $validated = $request->validate([
            'nom' => 'string|max:100',
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

        $validated = $request->validate([
            'statut' => 'required|in:a_demarrer,en_cours,terminee,annulee',
        ]);

        $phase->update(['statut' => $validated['statut']]);

        return response()->json($phase);
    }
}
