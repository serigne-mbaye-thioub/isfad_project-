<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepenseController extends Controller
{
    /**
     * Ajouter une dépense sur un budget.
     */
    public function store(Request $request, int $idBudget): JsonResponse
    {
        $validated = $request->validate([
            'description'    => 'required|string|max:255',
            'montant'        => 'required|numeric|min:1',
            'date_depense'   => 'required|date',
            'categorie'      => 'nullable|string|max:50',
            'statut'         => 'nullable|in:en_attente,approuvee,rejetee',
            'reference_facture' => 'nullable|string|max:100',
        ]);

        $budget = Budget::findOrFail($idBudget);

        $depense = new Depense($validated);
        $depense->id_budget = $budget->id;
        // Par défaut, l'auteur de la dépense est l'utilisateur connecté
        $depense->id_auteur = $request->user()->id;
        $depense->statut = $validated['statut'] ?? 'en_attente';
        
        $depense->save();

        return response()->json([
            'message' => 'Dépense ajoutée avec succès.',
            'depense' => $depense
        ], 201);
    }

    /**
     * Valider ou rejeter une dépense (workflow).
     */
    public function valider(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:approuvee,rejetee',
            'commentaire_approbateur' => 'nullable|string',
        ]);

        $depense = Depense::findOrFail($id);
        
        $depense->statut = $validated['statut'];
        $depense->id_approbateur = $request->user()->id;
        $depense->date_approbation = now();
        if (isset($validated['commentaire_approbateur'])) {
            $depense->commentaire_approbateur = $validated['commentaire_approbateur'];
        }

        $depense->save();

        return response()->json([
            'message' => 'Statut de la dépense mis à jour.',
            'depense' => $depense
        ]);
    }
}
