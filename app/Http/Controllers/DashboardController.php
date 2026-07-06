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

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/stats
     * Retourne les indicateurs décisionnels adaptés au rôle de l'utilisateur.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Vue Administrateur (Configuration Système)
        if ($user->isAdminGlobally()) {
            return $this->getAdminStats();
        }

        // 2. Vue Globale : Administrateur système, Superviseur, Gestionnaire de projet (qui ont la vision sur tous les projets)
        if (($user->hasRole('Gestionnaire de projet') || $user->isAdminGlobally()) && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet') {
            return $this->getSuperviseurStats($user);
        }

        // 3. Vue Chef de projet et Architecte (vision restreinte à leurs propres projets)
        if ($user->fonction === 'Chef de projet' || $user->fonction === 'Architecte de projet') {
            return $this->getGestionnaireStats($user);
        }

        // Autres (Membres) -> Pas de tableau de bord décisionnel complexe par défaut
        return response()->json(['message' => 'Pas de données de tableau de bord pour ce rôle.'], 200);
    }

    private function getAdminStats(): JsonResponse
    {
        $utilisateurs = [
            'total' => Utilisateur::count(),
            'actifs' => Utilisateur::where('actif', true)->count(),
            'inactifs' => Utilisateur::where('actif', false)->count(),
        ];

        $activite_recente = JournalAudit::with('utilisateur:id,nom,prenom,fonction')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'role_vue' => 'Administrateur',
            'utilisateurs' => $utilisateurs,
            'activite_recente' => $activite_recente,
        ]);
    }

    private function getSuperviseurStats(Utilisateur $user): JsonResponse
    {
        // KPI globaux sur TOUS les projets
        $projets_statuts = Projet::selectRaw('statut, count(*) as total')->groupBy('statut')->get();
        $projets_spse = Projet::selectRaw('etat_spse, count(*) as total')->groupBy('etat_spse')->get();
        $avancement_moyen = Projet::whereNotIn('statut', ['cloture', 'archive', 'annule'])->avg('avancement') ?? 0;
        
        $taches_statuts = Tache::selectRaw('statut, count(*) as total')->groupBy('statut')->get();
        $taches_en_retard = Tache::whereIn('statut', ['a_faire', 'en_cours', 'en_revision'])
            ->where('date_limite', '<', now()->startOfDay())
            ->count();

        $budget_alloue = Budget::sum('montant_initial') ?? 0;
        $budget_consomme = Depense::where('statut', 'approuvee')->sum('montant') ?? 0;

        return response()->json([
            'role_vue' => $user->fonction,
            'projets' => [
                'par_statut' => $projets_statuts,
                'par_etat_spse' => $projets_spse,
                'avancement_moyen' => round($avancement_moyen, 2),
                'total' => Projet::count(),
            ],
            'taches' => [
                'en_retard' => $taches_en_retard,
                'par_statut' => $taches_statuts,
            ],
            'finances' => [
                'alloue' => (float) $budget_alloue,
                'consomme' => (float) $budget_consomme,
            ],
        ]);
    }

    private function getGestionnaireStats(Utilisateur $user): JsonResponse
    {
        // Projets où l'utilisateur est membre actif ou créateur
        $projetsIds = Projet::where(function($query) use ($user) {
            $query->whereHas('participations', function($q) use ($user) {
                $q->where('id_utilisateur', $user->id)->where('statut', 'actif');
            })->orWhere('id_createur', $user->id);
        })->pluck('id');

        if ($projetsIds->isEmpty()) {
            return response()->json([
                'role_vue' => $user->fonction,
                'projets' => ['total' => 0, 'avancement_moyen' => 0, 'par_statut' => []],
                'taches' => ['en_retard' => 0, 'par_statut' => []],
            ]);
        }

        $projets_statuts = Projet::whereIn('id', $projetsIds)
            ->selectRaw('statut, count(*) as total')->groupBy('statut')->get();
        $avancement_moyen = Projet::whereIn('id', $projetsIds)
            ->whereNotIn('statut', ['cloture', 'archive', 'annule'])
            ->avg('avancement') ?? 0;

        $taches_statuts = Tache::whereIn('id_projet', $projetsIds)
            ->selectRaw('statut, count(*) as total')->groupBy('statut')->get();
        $taches_en_retard = Tache::whereIn('id_projet', $projetsIds)
            ->whereIn('statut', ['a_faire', 'en_cours', 'en_revision'])
            ->where('date_limite', '<', now()->startOfDay())
            ->count();

        return response()->json([
            'role_vue' => $user->fonction,
            'projets' => [
                'total' => $projetsIds->count(),
                'par_statut' => $projets_statuts,
                'avancement_moyen' => round($avancement_moyen, 2),
            ],
            'taches' => [
                'en_retard' => $taches_en_retard,
                'par_statut' => $taches_statuts,
            ],
        ]);
    }
}
