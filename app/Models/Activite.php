<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Activite — Unité de travail au sein d'une phase de projet.
 *
 * Une activité appartient à une phase et est décomposée en tâches.
 * Elle possède un responsable optionnel.
 */
class Activite extends Model
{
    use HasFactory;

    protected $table = 'activites';

    protected $fillable = [
        'id_projet',
        'id_phase',
        'id_jalon',
        'titre',
        'description',
        'date_debut',
        'date_fin',
        'statut',
        'priorite',
        'avancement',
        'id_responsable',
    ];

    protected function casts(): array
    {
        return [
            'date_debut'  => 'date',
            'date_fin'    => 'date',
            'avancement'  => 'decimal:2',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Phase à laquelle appartient cette activité */
    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class, 'id_phase');
    }

    /**
     * Le jalon parent de l'activité (optionnel).
     */
    public function jalon(): BelongsTo
    {
        return $this->belongsTo(Jalon::class, 'id_jalon');
    }

    /**
     * Le projet global auquel l'activité appartient.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }

    /** Responsable de l'activité (peut être NULL) */
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_responsable');
    }

    /** Tâches composant cette activité */
    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_activite');
    }

    // ─── Raccourcis ───────────────────────────────────────────────────────────
}
