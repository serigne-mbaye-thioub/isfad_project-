<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DemandeChangement — Demande de modification sur une entité du projet.
 *
 * Utilise un système de référence polymorphe manuel (type_cible + id_cible)
 * pour pointer vers un projet, une phase, une activité, une tâche ou
 * une réunion. Le niveau d'approbation détermine qui peut valider la demande.
 */
class DemandeChangement extends Model
{
    use HasFactory;

    protected $table = 'demande_changements';

    protected $fillable = [
        'type_cible',
        'id_cible',
        'titre',
        'description',
        'justification',
        'statut',
        'niveau_approbation',
        'id_demandeur',
        'date_traitement',
    ];

    protected function casts(): array
    {
        return [
            'id_cible'         => 'integer',
            'date_traitement'  => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Utilisateur ayant soumis la demande */
    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_demandeur');
    }

    // ─── Résolution polymorphe manuelle ───────────────────────────────────────

    /**
     * Retourne l'entité cible de la demande selon son type.
     * Types supportés : projet, phase, activite, tache, reunion
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function getCible(): ?Model
    {
        return match ($this->type_cible) {
            'projet'   => Projet::find($this->id_cible),
            'phase'    => Phase::find($this->id_cible),
            'activite' => Activite::find($this->id_cible),
            'tache'    => Tache::find($this->id_cible),
            'reunion'  => Reunion::find($this->id_cible),
            default    => null,
        };
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /** Indique si la demande est encore en attente de traitement */
    public function getEstEnAttenteAttribute(): bool
    {
        return $this->statut === 'en_attente';
    }
}
