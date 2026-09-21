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

        if ($user->isAdminGlobally()) {
            return $this->getAdminStats($user);
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

        // Autres (Membres) -> Vue détaillée pour les collaborateurs
        return $this->getMembreStats($user);
    }

    private function getAdminStats(Utilisateur $user): JsonResponse
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
            'sa_journee' => $this->getSaJournee($user)
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
            ->whereNotIn('statut', ['archive', 'annule', 'cloture'])
            ->pluck('id')->toArray();

        $safeProjetIds = empty($projetsIds) ? [0] : $projetsIds;

        $activitesIds = \App\Models\Activite::whereIn('id_projet', $safeProjetIds)->pluck('id')->toArray();
        
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
            ->where(function ($q) use ($user) {
                $q->where('id_organisateur', $user->id)
                  ->orWhereHas('participants', function ($q2) use ($user) {
                      $q2->where('id_utilisateur', $user->id);
                  });
            })->count();

        $projetsActifsList = Projet::whereIn('id', empty($projetsIds) ? [0] : $projetsIds)
            ->whereNotIn('statut', ['cloture', 'archive', 'annule'])
            ->get(['id', 'statut', 'date_fin']);

        $projetsARisque = 0;
        foreach ($projetsActifsList as $p) {
            $isAtRisk = false;
            
            // Règle 1 : Projet formellement suspendu
            if ($p->statut === 'suspendu') {
                $isAtRisk = true;
            }
            // Règle 2 : Date de fin globale dépassée
            elseif ($p->date_fin && \Carbon\Carbon::parse($p->date_fin)->isPast()) {
                $isAtRisk = true;
            }
            // Règle 3 (Ingénierie) : Analyse quantitative des goulets d'étranglement (Tâches en retard)
            else {
                $actIds = \App\Models\Activite::where('id_projet', $p->id)->pluck('id')->toArray();
                
                $projetTachesQuery = \App\Models\Tache::whereNotIn('statut', ['terminee', 'cloture'])
                    ->where(function($q) use ($p, $actIds) {
                        $q->where('id_projet', $p->id);
                        if (!empty($actIds)) {
                            $q->orWhereIn('id_activite', $actIds);
                        }
                    });

                $totalTaches = (clone $projetTachesQuery)->count();
                $tachesEnRetard = (clone $projetTachesQuery)->where('date_limite', '<', now()->startOfDay())->count();

                if ($totalTaches > 0) {
                    $ratioRetard = $tachesEnRetard / $totalTaches;
                    // Un projet est à risque si :
                    // - Plus de 30% de ses tâches actives sont en retard (avec un minimum absolu de 3 tâches pour éviter les faux positifs)
                    // OU
                    // - Il a plus de 6 tâches en retard au total (volume critique de blocage)
                    if (($ratioRetard >= 0.30 && $tachesEnRetard >= 3) || $tachesEnRetard >= 6) {
                        $isAtRisk = true;
                    }
                }
            }

            if ($isAtRisk) {
                $projetsARisque++;
            }
        }

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
            'sa_journee' => $this->getSaJournee($user, $tachesQuery, $roleVue)
        ]);
    }

    private function getMembreStats($user): JsonResponse
    {
        // Projets où l'utilisateur est membre
        $projetsIds = \App\Models\ParticipationProjet::where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->whereHas('projet', function ($q) {
                $q->whereNotIn('statut', ['archive', 'annule', 'cloture']);
            })
            ->pluck('id_projet')->toArray();

        $safeProjetIds = empty($projetsIds) ? [0] : $projetsIds;

        $activitesIds = \App\Models\Activite::whereIn('id_projet', $safeProjetIds)->pluck('id')->toArray();
        $safeActivitesIds = empty($activitesIds) ? [0] : $activitesIds;

        // Requête pour les tâches (assigné ou RACI) uniquement sur les projets actifs
        $tachesQuery = function($q) use ($user, $safeProjetIds, $safeActivitesIds) {
            $q->where(function($q2) use ($user) {
                $q2->where('id_responsable', $user->id)
                   ->orWhereHas('racis', function($r) use ($user) {
                       $r->where('id_utilisateur', $user->id);
                   });
            })->where(function($q3) use ($safeProjetIds, $safeActivitesIds) {
                $q3->whereIn('id_projet', $safeProjetIds)->orWhereIn('id_activite', $safeActivitesIds);
            });
        };

        $totalTaches = Tache::where($tachesQuery)->count();
        $tachesAfaire = Tache::where($tachesQuery)->where('statut', 'a_faire')->count();
        $tachesEnCours = Tache::where($tachesQuery)->where('statut', 'en_cours')->count();
        $tachesTerminees = Tache::where($tachesQuery)->whereIn('statut', ['terminee', 'cloture'])->count();
        $tachesEnRetard = Tache::where($tachesQuery)->whereIn('statut', ['a_faire', 'en_cours', 'en_revision'])->where('date_limite', '<', now()->startOfDay())->count();

        // Prochaines réunions
        $reunionsAVenir = \App\Models\Reunion::where('statut', 'planifiee')
            ->where('date_reunion', '>=', now())
            ->where(function ($q) use ($user) {
                $q->where('id_organisateur', $user->id)
                  ->orWhereHas('participants', function ($q2) use ($user) {
                      $q2->where('id_utilisateur', $user->id);
                  });
            })
            ->with('projet:id,titre')
            ->orderBy('date_reunion', 'asc')
            ->limit(5)
            ->get();

        // Tâches récentes / urgentes
        $tachesUrgentes = Tache::where($tachesQuery)
            ->whereNotIn('statut', ['terminee', 'cloture'])
            ->with(['activite.phase'])
            ->orderBy('date_limite', 'asc')
            ->limit(5)
            ->get();

        // Avancement des projets
        $avancementProjets = Projet::whereIn('id', $safeProjetIds)
            ->whereNotIn('statut', ['cloture', 'archive', 'annule'])
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'titre', 'avancement']);

        return response()->json([
            'role_vue' => 'Membre',
            'kpis' => [
                'total_taches' => $totalTaches,
                'taches_a_faire' => $tachesAfaire,
                'taches_en_cours' => $tachesEnCours,
                'taches_terminees' => $tachesTerminees,
                'taches_en_retard' => $tachesEnRetard,
                'projets_actifs' => count($projetsIds),
                'reunions_a_venir' => count($reunionsAVenir),
            ],
            'avancement_projets' => $avancementProjets,
            'taches_urgentes' => $tachesUrgentes,
            'reunions_a_venir_list' => $reunionsAVenir,
            'sa_journee' => $this->getSaJournee($user, $tachesQuery, 'Membre')
        ]);
    }

    private function getSaJournee($user, $tachesQuery = null, $roleVue = 'Membre')
    {
        $today = now()->format('Y-m-d');
        
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        $managedProjectIds = [];
        
        if ($isAdmin) {
            $managedProjectIds = \App\Models\Projet::pluck('id')->toArray();
        } else {
            $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
            $globalManaged = $isGlobalManager ? \App\Models\Projet::where('transmis_gestionnaire', true)->pluck('id')->toArray() : [];
            $localManaged = \App\Models\ParticipationProjet::where('id_utilisateur', $user->id)
                ->whereIn('role_projet', ['chef_projet', 'gestionnaire', 'architecte'])
                ->where('statut', 'actif')
                ->pluck('id_projet')->toArray();
            $managedProjectIds = array_unique(array_merge($globalManaged, $localManaged));
        }

        $taches = \App\Models\Tache::query();
        if (!$isAdmin) {
            // Filtrer explicitement les projets clôturés (groupé)
            $taches->where(function($queryWrapper) {
                $queryWrapper->whereHas('projet', function($q) {
                    $q->whereNotIn('statut', ['archive', 'annule', 'cloture']);
                })->orWhereHas('activite.projet', function($q2) {
                    $q2->whereNotIn('statut', ['archive', 'annule', 'cloture']);
                });
            });

            $taches->where(function($q) use ($user, $managedProjectIds) {
                if (!empty($managedProjectIds)) {
                    $q->whereIn('id_projet', $managedProjectIds)
                      ->orWhereHas('activite.phase', function($q2) use ($managedProjectIds) {
                          $q2->whereIn('id_projet', $managedProjectIds);
                      });
                }
                $q->orWhere('id_responsable', $user->id)
                  ->orWhere('id_approbateur', $user->id)
                  ->orWhereHas('racis', function($qRaci) use ($user) {
                      $qRaci->where('id_utilisateur', $user->id);
                  });
            });
        }
        
        $taches = $taches->whereDate('date_limite', '<=', $today)
            ->whereNotIn('statut', ['terminee', 'cloture'])
            ->with('projet:id,titre')
            ->get(['id', 'titre', 'statut', 'priorite', 'date_limite', 'id_projet']);

        $reunions = \App\Models\Reunion::query();
        if (!$isAdmin) {
            $reunions->where(function($q) use ($user) {
                $q->where('id_organisateur', $user->id)
                  ->orWhereHas('participants', function($qPart) use ($user) {
                      $qPart->where('id_utilisateur', $user->id);
                  });
            });
        }
        
        $reunions = $reunions->whereDate('date_reunion', $today)
            ->where('statut', '!=', 'annulee')
            ->with('projet:id,titre')
            ->orderBy('date_reunion', 'asc')
            ->get(['id', 'titre', 'date_reunion', 'duree_minutes', 'statut', 'id_projet']);

        return [
            'taches' => $taches,
            'reunions' => $reunions
        ];
    }
}
