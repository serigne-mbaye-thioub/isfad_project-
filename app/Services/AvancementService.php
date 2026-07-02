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
                
                $phase = Phase::find($activite->id_phase);
                if ($phase) {
                    $this->recalculerPhase($phase);
                    $this->recalculerProjet(Projet::find($phase->id_projet));
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

        $terminees = $activite->taches()->where('statut', 'terminee')->count();
        $pourcentage = ($terminees / $total) * 100;
        
        $activite->update(['avancement' => $pourcentage]);
    }

    private function recalculerPhase(Phase $phase)
    {
        $total = $phase->activites()->count();
        if ($total === 0) {
            $phase->update(['avancement' => 0]);
            return;
        }

        // On fait la moyenne des avancements des activités
        $pourcentage = $phase->activites()->avg('avancement');
        
        $phase->update(['avancement' => $pourcentage]);
    }

    private function recalculerProjet(Projet $projet)
    {
        // Un projet peut avoir des phases ET/OU des tâches directes.
        $totalPhases = $projet->phases()->count();
        $totalTaches = $projet->taches()->count();

        if ($totalPhases === 0 && $totalTaches === 0) {
            $projet->update(['avancement' => 0]);
            return;
        }

        $sommePhases = 0;
        if ($totalPhases > 0) {
            $sommePhases = $projet->phases()->avg('avancement') * $totalPhases;
        }

        $sommeTaches = 0;
        if ($totalTaches > 0) {
            $tachesTerminees = $projet->taches()->where('statut', 'terminee')->count();
            // L'avancement des tâches directes
            $avancementTaches = ($tachesTerminees / $totalTaches) * 100;
            $sommeTaches = $avancementTaches * $totalTaches; // on pondère
        }

        // Moyenne globale pondérée par le nombre d'éléments de premier niveau (phases + taches directes)
        $pourcentage = ($sommePhases + $sommeTaches) / ($totalPhases + $totalTaches);

        $projet->update(['avancement' => $pourcentage]);
    }
}
