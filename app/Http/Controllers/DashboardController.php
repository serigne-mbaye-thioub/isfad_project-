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

        // 2. Vue Globale : Superviseur, Gestionnaire de projet (qui ont la vision sur tous les projets)
        if ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet') {
            return $this->getSuperviseurStats($user);
        }

        // 3. Vue Chef de projet (vision restreinte à ses projets)
        if ($user->fonction === 'Chef de projet') {
            return $this->getGestionnaireStats($user);
        }

        // 4. Vue Architecte (vision restreinte aux projets qu'il a initiés)
        if ($user->fonction === 'Architecte' || $user->fonction === 'Architecte de projet') {
            return $this->getArchitecteStats($user);
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
        $projetsIds = Projet::where('transmis_gestionnaire', true)
            ->orWhere('id_createur', $user->id)
            ->orWhereHas('participations', function($q) use ($user) {
                $q->where('id_utilisateur', $user->id)->where('statut', 'actif');
            })
            ->pluck('id')->toArray();
            
        return $this->buildDecisionDashboard($user, $projetsIds);
    }

    private function getGestionnaireStats(Utilisateur $user): JsonResponse
    {
        $projetsIds = Projet::where(function($query) use ($user) {
            $query->whereHas('participations', function($q) use ($user) {
                $q->where('id_utilisateur', $user->id)->where('statut', 'actif');
            })->orWhere('id_createur', $user->id);
        })->pluck('id')->toArray();
        
        return $this->buildDecisionDashboard($user, $projetsIds);
    }

    private function getArchitecteStats(Utilisateur $user): JsonResponse
    {
        // L'architecte ne voit que les projets qu'il a initiés.
        $projetsIds = Projet::where('id_createur', $user->id)->pluck('id')->toArray();
        
        return $this->buildDecisionDashboard($user, $projetsIds, 'Architecte');
    }

    private function buildDecisionDashboard(Utilisateur $user, array $projetsIds, string $roleVue = 'Gestionnaire'): JsonResponse
    {
        // Filtrer pour ne conserver que les projets actifs (non archivés, non annulés)
        $projetsIds = \App\Models\Projet::whereIn('id', empty($projetsIds) ? [0] : $projetsIds)
            ->whereNotIn('statut', ['archive', 'annule'])
            ->pluck('id')->toArray();

        $safeProjetIds = empty($projetsIds) ? [0] : $projetsIds;

        $activitesIds = \App\Models\Activite::whereHas('phase', function($q) use ($safeProjetIds) {
            $q->whereIn('id_projet', $safeProjetIds);
        })->pluck('id')->toArray();
        
        $safeActivitesIds = empty($activitesIds) ? [0] : $activitesIds;

        // KPIs
        $totalProjets = count($projetsIds);
        
        $tachesQuery = function($q) use ($safeProjetIds, $safeActivitesIds) {
            $q->whereIn('id_projet', $safeProjetIds)->orWhereIn('id_activite', $safeActivitesIds);
        };

        $totalTaches = Tache::where($tachesQuery)->count();
        $tachesEnCours = Tache::where($tachesQuery)->where('statut', 'en_cours')->count();
        $tachesEnRetard = Tache::where($tachesQuery)->whereIn('statut', ['a_faire', 'en_cours', 'en_revision'])->where('date_limite', '<', now()->startOfDay())->count();
        
        $reunionsAVenir = \App\Models\Reunion::where('statut', 'planifiee')
            ->where('date_reunion', '>=', now())
            ->where(function ($q) use ($user, $projetsIds) {
                if (!empty($projetsIds)) {
                    $q->whereIn('id_projet', $projetsIds)
                      ->orWhere('id_organisateur', $user->id)
                      ->orWhereHas('participants', function ($q2) use ($user) {
                          $q2->where('id_utilisateur', $user->id);
                      });
                } else {
                    $q->where('id_organisateur', $user->id)
                      ->orWhereHas('participants', function ($q2) use ($user) {
                          $q2->where('id_utilisateur', $user->id);
                      });
                }
            })->count();

        $projetsARisque = Projet::whereIn('id', empty($projetsIds) ? [0] : $projetsIds)
            ->where(function($q) {
                $q->where('statut', 'suspendu')
                  ->orWhere('priorite', 'critique');
            })->count();

        // Avancement des projets récents (tous les non-cloturés)
        $avancementProjets = Projet::whereIn('id', empty($projetsIds) ? [0] : $projetsIds)
            ->whereNotIn('statut', ['cloture', 'archive', 'annule'])
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'titre', 'avancement']);

        // Actions requises
        $demandesEnAttente = \App\Models\DemandeChangement::where('statut', 'en_attente')
            ->where('type_cible', 'projet')
            ->whereIn('id_cible', empty($projetsIds) ? [0] : $projetsIds)
            ->count();

        $tachesCritiques = Tache::where($tachesQuery)
            ->whereIn('statut', ['a_faire', 'en_cours'])
            ->where('priorite', 'critique')
            ->with(['responsable:id,nom,prenom', 'activite.phase'])
            ->orderBy('date_limite', 'asc')
            ->limit(10)
            ->get(['id', 'titre', 'date_limite', 'id_responsable', 'id_activite']);

        // Tâches terminées par mois (6 derniers mois)
        $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
        $tachesTerminees = Tache::where($tachesQuery)
            ->where('statut', 'terminee')
            ->whereNotNull('date_cloture')
            ->where('date_cloture', '>=', $sixMonthsAgo)
            ->get(['date_cloture']);
        
        $months = [];
        $moisFr = [1=>'Jan', 2=>'Fév', 3=>'Mar', 4=>'Avr', 5=>'Mai', 6=>'Juin', 7=>'Juil', 8=>'Aoû', 9=>'Sep', 10=>'Oct', 11=>'Nov', 12=>'Déc'];
        
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->subMonths($i);
            $key = $m->format('Y-m');
            $months[$key] = [
                'label' => $moisFr[(int)$m->format('n')],
                'count' => 0
            ];
        }
        
        foreach ($tachesTerminees as $t) {
            $key = \Carbon\Carbon::parse($t->date_cloture)->format('Y-m');
            if (isset($months[$key])) {
                $months[$key]['count']++;
            }
        }

        // Répartition des tâches par statut
        $tachesStatuts = Tache::where($tachesQuery)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->get();

        return response()->json([
            'role_vue' => $roleVue,
            'kpis' => [
                'projets_geres' => $totalProjets,
                'total_taches' => $totalTaches,
                'taches_en_cours' => $tachesEnCours,
                'taches_en_retard' => $tachesEnRetard,
                'reunions_a_venir' => $reunionsAVenir,
                'projets_a_risque' => $projetsARisque,
            ],
            'avancement_projets' => $avancementProjets,
            'actions_requises' => [
                'demandes_changement' => $demandesEnAttente,
                'taches_critiques' => $tachesCritiques,
            ],
            'taches_terminees_mois' => array_values($months),
            'repartition_taches' => $tachesStatuts,
        ]);
    }
}
