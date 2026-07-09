<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tache;
use App\Models\Reunion;
use App\Models\Jalon;
use App\Models\ParticipationProjet;

class CalendrierController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        
        // Obtenir les IDs des projets où l'utilisateur est un "manager"
        $managedProjectIds = [];
        if ($isAdmin) {
            $managedProjectIds = \App\Models\Projet::pluck('id')->toArray();
        } else {
            // S'il est Gestionnaire global et le projet est transmis
            $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
            
            $globalManaged = [];
            if ($isGlobalManager) {
                $globalManaged = \App\Models\Projet::where('transmis_gestionnaire', true)->pluck('id')->toArray();
            }

            $localManaged = ParticipationProjet::where('id_utilisateur', $user->id)
                ->whereIn('role_projet', ['chef_projet', 'gestionnaire', 'architecte'])
                ->where('statut', 'actif')
                ->pluck('id_projet')->toArray();

            $managedProjectIds = array_unique(array_merge($globalManaged, $localManaged));
        }

        $events = [];

        // 1. Tâches (date_limite)
        $tachesQuery = Tache::with('projet:id,titre');
        if (!$isAdmin) {
            $tachesQuery->where(function($q) use ($user, $managedProjectIds) {
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
        $taches = $tachesQuery->whereNotNull('date_limite')->get();

        foreach ($taches as $tache) {
            $projetTitre = $tache->projet ? $tache->projet->titre : ($tache->activite && $tache->activite->phase ? $tache->activite->phase->projet->titre : 'Sans projet');
            $events[] = [
                'id' => 'tache_' . $tache->id,
                'type' => 'tache',
                'titre' => $tache->titre,
                'date' => substr($tache->date_limite, 0, 10),
                'projet_titre' => $projetTitre,
                'statut' => $tache->statut
            ];
        }

        // 2. Réunions (date_reunion)
        $reunionsQuery = Reunion::with('projet:id,titre');
        if (!$isAdmin) {
            $reunionsQuery->where(function($q) use ($user, $managedProjectIds) {
                if (!empty($managedProjectIds)) {
                    $q->whereIn('id_projet', $managedProjectIds);
                }
                $q->orWhere('id_organisateur', $user->id)
                  ->orWhereHas('participants', function($qPart) use ($user) {
                      $qPart->where('id_utilisateur', $user->id);
                  });
            });
        }
        $reunions = $reunionsQuery->whereNotNull('date_reunion')->get();

        foreach ($reunions as $reunion) {
            $events[] = [
                'id' => 'reunion_' . $reunion->id,
                'type' => 'reunion',
                'titre' => $reunion->titre,
                'date' => substr($reunion->date_reunion, 0, 10),
                'projet_titre' => $reunion->projet ? $reunion->projet->titre : 'Sans projet',
                'statut' => $reunion->statut
            ];
        }

        // 3. Jalons (echeance)
        $jalonsQuery = Jalon::with('projet:id,titre');
        if (!$isAdmin) {
            $participatingProjects = ParticipationProjet::where('id_utilisateur', $user->id)
                                        ->where('statut', 'actif')
                                        ->pluck('id_projet')->toArray();
            $allVisibleProjects = array_unique(array_merge($managedProjectIds, $participatingProjects));

            if (!empty($allVisibleProjects)) {
                $jalonsQuery->whereIn('id_projet', $allVisibleProjects);
            } else {
                $jalonsQuery->whereRaw('1 = 0'); // Retourne vide si aucun projet
            }
        }
        $jalons = $jalonsQuery->whereNotNull('echeance')->get();

        foreach ($jalons as $jalon) {
            $events[] = [
                'id' => 'jalon_' . $jalon->id,
                'type' => 'jalon',
                'titre' => $jalon->titre,
                'date' => substr($jalon->echeance, 0, 10),
                'projet_titre' => $jalon->projet ? $jalon->projet->titre : 'Sans projet',
                'statut' => $jalon->statut
            ];
        }

        usort($events, function($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        return response()->json($events);
    }
}
