<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Projet;
use App\Models\Tache;
use App\Models\JournalAudit;
use App\Models\Budget;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard/stats
     * Retourne les indicateurs de santé globaux pour l'Administrateur.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->fonction, ['Administrateur', 'Administrateur système'])) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        // KPI 1 : Comptes utilisateurs
        $utilisateurs = [
            'total' => Utilisateur::count(),
            'actifs' => Utilisateur::where('actif', true)->count(),
            'inactifs' => Utilisateur::where('actif', false)->count(),
        ];

        // KPI 2 : Projets par statut et état SPSE
        $projets_statuts = Projet::selectRaw('statut, count(*) as total')->groupBy('statut')->get();
        $projets_spse = Projet::selectRaw('etat_spse, count(*) as total')->groupBy('etat_spse')->get();

        // KPI 3 : Avancement moyen de tous les projets en cours
        $avancement_moyen = Projet::whereNotIn('statut', ['cloture', 'archive', 'annule'])
            ->avg('avancement') ?? 0;

        // KPI 4 : Tâches par statut
        $taches_statuts = Tache::selectRaw('statut, count(*) as total')->groupBy('statut')->get();

        // KPI 5 : Tâches globales en retard
        $taches_en_retard = Tache::whereIn('statut', ['a_faire', 'en_cours', 'en_revision'])
            ->where('date_limite', '<', now()->startOfDay())
            ->count();

        // KPI 6 : Indicateur de Budget Global
        // (Si la table existe et a des données)
        $budget_alloue = Budget::sum('montant_alloue') ?? 0;
        $budget_consomme = Depense::where('statut', 'approuvee')->sum('montant') ?? 0;

        // KPI 7 : Activité récente (10 dernières actions du système)
        $activite_recente = JournalAudit::with('utilisateur:id,nom,prenom,fonction')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'utilisateurs' => $utilisateurs,
            'projets' => [
                'par_statut' => $projets_statuts,
                'par_etat_spse' => $projets_spse,
                'avancement_moyen' => round($avancement_moyen, 2),
            ],
            'taches' => [
                'en_retard' => $taches_en_retard,
                'par_statut' => $taches_statuts,
            ],
            'finances' => [
                'alloue' => (float) $budget_alloue,
                'consomme' => (float) $budget_consomme,
            ],
            'activite_recente' => $activite_recente
        ]);
    }
}
