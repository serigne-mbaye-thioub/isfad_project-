<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Projet;
use App\Models\Tache;
use App\Models\JournalAudit;
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

        // KPI 3 : Tâches globales en retard
        $taches_en_retard = Tache::whereIn('statut', ['a_faire', 'en_cours'])
            ->where('date_limite', '<', now()->startOfDay())
            ->count();

        // KPI 4 : Activité récente (10 dernières actions du système)
        $activite_recente = JournalAudit::with('utilisateur:id,nom,prenom,fonction')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'utilisateurs' => $utilisateurs,
            'projets' => [
                'par_statut' => $projets_statuts,
                'par_etat_spse' => $projets_spse,
            ],
            'taches_en_retard' => $taches_en_retard,
            'activite_recente' => $activite_recente
        ]);
    }
}
