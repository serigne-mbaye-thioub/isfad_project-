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
        
        $user = $request->user();
        $isGlobalAdmin = $user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        $isChef = \App\Models\ParticipationProjet::where('id_projet', $budget->id_projet)
            ->where('id_utilisateur', $user->id)
            ->where('role_projet', 'chef_projet')
            ->where('statut', 'actif')
            ->exists();

        if (!$isGlobalAdmin && !$isChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Chef de projet, le Gestionnaire ou l\'Administrateur peut ajouter une dépense.'], 403);
        }

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

        $depense = Depense::with('budget')->findOrFail($id);
        
        $user = $request->user();
        $isGlobalAdmin = $user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if (!$isGlobalAdmin) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire de projet ou l\'Administrateur peut approuver ou rejeter une dépense.'], 403);
        }
        
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
