<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Jalon — Événement clé du calendrier d'un projet.
 *
 * Un jalon marque un moment décisif (livraison, validation, clôture d'étape).
 * Il est obligatoirement lié à un projet et optionnellement à une phase.
 */
class Jalon extends Model
{
    use HasFactory;

    protected $table = 'jalons';

    protected $fillable = [
        'id_projet',
        'id_phase',
        'titre',
        'description',
        'echeance',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'echeance' => 'date',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Projet auquel appartient ce jalon */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }

    /**
     * Phase à laquelle ce jalon est rattaché (optionnel).
     * NULL si le jalon est au niveau projet uniquement.
     */
    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class, 'id_phase');
    }

    /** Les activités rattachées à ce jalon */
    public function activites(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Activite::class, 'id_jalon');
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /** Indique si le jalon est manqué (échéance dépassée sans être atteint) */
    public function getEstManqueAttribute(): bool
    {
        return $this->statut === 'en_attente'
            && now()->toDateString() > $this->echeance?->toDateString();
    }
}
