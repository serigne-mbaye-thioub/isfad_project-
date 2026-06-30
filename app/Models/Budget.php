<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Budget — Budget unique associé à un projet.
 *
 * Un seul budget par projet (contrainte unique sur id_projet).
 * Le montant disponible est calculé dynamiquement via un accesseur
 * et non stocké en base pour éviter les désynchronisations.
 */
class Budget extends Model
{
    use HasFactory;

    protected $table = 'budgets';

    protected $fillable = [
        'id_projet',
        'montant_initial',
        'montant_consomme',
        'devise',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'montant_initial'  => 'decimal:2',
            'montant_consomme' => 'decimal:2',
        ];
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /**
     * Montant disponible calculé à la volée.
     * = montant_initial - montant_consomme
     * Non stocké en base pour éviter les désynchronisations.
     */
    public function getMontantDisponibleAttribute(): float
    {
        return (float) $this->montant_initial - (float) $this->montant_consomme;
    }

    /** Indique si le budget est dépassé */
    public function getEstDepasAttribute(): bool
    {
        return $this->getMontantDisponibleAttribute() < 0;
    }

    /** Taux de consommation en pourcentage */
    public function getTauxConsommationAttribute(): float
    {
        if ((float) $this->montant_initial === 0.0) {
            return 0.0;
        }

        return round(((float) $this->montant_consomme / (float) $this->montant_initial) * 100, 2);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Projet auquel appartient ce budget */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }

    /** Dépenses imputées sur ce budget */
    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class, 'id_budget');
    }
}
