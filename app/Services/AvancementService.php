<?php

namespace App\Services;

use App\Models\Projet;
use App\Models\Phase;
use App\Models\Activite;

class AvancementService
{
    /**
     * Recalcule l'avancement en cascade à partir d'une activité ou d'un projet
     */
    public function recalculerAvancementCascade($id_activite = null, $id_projet = null)
    {
        if ($id_activite) {
            $activite = Activite::with('taches')->find($id_activite);
            if ($activite) {
                $this->recalculerActivite($activite);
                
                if ($activite->id_phase) {
                    $phase = Phase::find($activite->id_phase);
                    if ($phase) {
                        $this->recalculerPhase($phase);
                        $this->recalculerProjet(Projet::find($phase->id_projet));
                    }
                } else {
                    $this->recalculerProjet(Projet::find($activite->id_projet));
                }
            }
        } elseif ($id_projet) {
            $projet = Projet::find($id_projet);
            if ($projet) {
                $this->recalculerProjet($projet);
            }
        }
    }

    private function recalculerActivite(Activite $activite)
    {
        $total = $activite->taches()->count();
        if ($total === 0) {
            $activite->update(['avancement' => 0]);
            return;
        }

        $terminees = $activite->taches()->whereIn('statut', ['terminee', 'archivee'])->count();
        $pourcentage = ($terminees / $total) * 100;
        
        $activite->update(['avancement' => $pourcentage]);
    }

    private function recalculerPhase(Phase $phase)
    {
        $activites = Activite::where('id_phase', $phase->id)->get();
        $total = $activites->count();
        if ($total === 0) {
            $phase->update(['avancement' => 0]);
            return;
        }

        $pourcentage = $activites->avg('avancement');
        $phase->update(['avancement' => $pourcentage]);
    }

    private function recalculerProjet(Projet $projet)
    {
        if (!$projet) return;

        $totalPhases = $projet->phases()->count();
        $totalActivitesDirectes = Activite::where('id_projet', $projet->id)->whereNull('id_phase')->count();
        $totalTachesDirectes = $projet->taches()->count();

        $totalPoids = $totalPhases + $totalActivitesDirectes + $totalTachesDirectes;

        if ($totalPoids === 0) {
            $projet->update(['avancement' => 0]);
            return;
        }

        $somme = 0;
        if ($totalPhases > 0) {
            $somme += $projet->phases()->sum('avancement');
        }
        if ($totalActivitesDirectes > 0) {
            $somme += Activite::where('id_projet', $projet->id)->whereNull('id_phase')->sum('avancement');
        }
        if ($totalTachesDirectes > 0) {
            $terminees = $projet->taches()->whereIn('statut', ['terminee', 'archivee'])->count();
            $somme += $terminees * 100;
        }

        $pourcentage = $somme / $totalPoids;

        $dataToUpdate = ['avancement' => $pourcentage];
        
        // Changement automatique de statut selon l'avancement
        if ($pourcentage > 0 && $pourcentage < 100 && $projet->statut === 'a_demarrer') {
            $dataToUpdate['statut'] = 'en_cours';
        } elseif ($pourcentage == 100 && $projet->statut !== 'cloture' && $projet->statut !== 'archive') {
            $dataToUpdate['statut'] = 'cloture';
        }

        $projet->update($dataToUpdate);
    }
}
