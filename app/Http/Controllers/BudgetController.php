<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Projet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BudgetController extends Controller
{
    /**
     * Obtenir le budget d'un projet avec ses dépenses.
     */
    public function show(int $idProjet): JsonResponse
    {
        $projet = Projet::findOrFail($idProjet);

        $user = request()->user();
        $isGlobalAdmin = $user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        $isChef = \App\Models\ParticipationProjet::where('id_projet', $idProjet)
            ->where('id_utilisateur', $user->id)
            ->where('role_projet', 'chef_projet')
            ->where('statut', 'actif')
            ->exists();

        if (!$isGlobalAdmin && !$isChef) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Chef de projet, le Gestionnaire ou l\'Administrateur peut voir le budget.'], 403);
        }

        $budget = Budget::where('id_projet', $idProjet)
            ->with(['depenses' => function ($query) {
                $query->orderBy('date_depense', 'desc');
            }])
            ->first();

        if (!$budget) {
            return response()->json(['message' => 'Aucun budget défini pour ce projet.'], 404);
        }

        // Calculs des totaux
        $total_depense = $budget->depenses->where('statut', 'approuvee')->sum('montant');
        $en_attente = $budget->depenses->where('statut', 'en_attente')->sum('montant');
        $reste = $budget->montant_initial - $total_depense;

        return response()->json([
            'budget' => $budget,
            'statistiques' => [
                'total_alloue' => $budget->montant_initial,
                'total_consomme' => $total_depense,
                'total_en_attente' => $en_attente,
                'reste_a_depenser' => $reste,
                'pourcentage_consomme' => $budget->montant_initial > 0 ? round(($total_depense / $budget->montant_initial) * 100, 2) : 0,
            ]
        ]);
    }

    /**
     * Initialiser ou mettre à jour le budget d'un projet.
     */
    public function storeOrUpdate(Request $request, int $idProjet): JsonResponse
    {
        $user = $request->user();
        $isGlobalAdmin = $user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if (!$isGlobalAdmin) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Gestionnaire de projet ou l\'Administrateur peut modifier le budget.'], 403);
        }

        $validated = $request->validate([
            'montant_initial' => 'required|numeric|min:0',
            'devise'         => 'nullable|string|max:10',
            'annee_fiscale'  => 'nullable|string|max:9',
        ]);

        $projet = Projet::findOrFail($idProjet);

        $budget = Budget::updateOrCreate(
            ['id_projet' => $idProjet],
            [
                'montant_initial' => $validated['montant_initial'],
                'devise'         => $validated['devise'] ?? 'XOF',
                'annee_fiscale'  => $validated['annee_fiscale'] ?? date('Y'),
            ]
        );

        return response()->json([
            'message' => 'Budget enregistré avec succès.',
            'budget' => $budget
        ]);
    }
}
