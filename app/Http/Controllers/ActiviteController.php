<?php

namespace App\Http\Controllers;

use App\Models\Activite;
use App\Models\Phase;
use Illuminate\Http\Request;

class ActiviteController extends Controller
{
    /**
     * Création d'une activité dans une phase
     */
    public function store(Request $request, $id_phase)
    {
        $phase = Phase::findOrFail($id_phase);

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
    public function destroy($id)
    {
        $activite = Activite::findOrFail($id);
        $activite->delete();

        return response()->json(['message' => 'Activité supprimée avec succès'], 200);
    }
}
