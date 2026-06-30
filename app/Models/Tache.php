<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tache — Unité atomique de travail assignée dans le cadre RACI.
 *
 * Chaque tâche possède un Responsable (R) obligatoire et un Approbateur (A)
 * optionnel, stockés directement sur la table. Les rôles Consulté (C) et
 * Informé (I) sont gérés via la table `tache_racis`.
 */
class Tache extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'taches';

    protected $fillable = [
        'id_activite',
        'titre',
        'description',
        'priorite',
        'date_debut',
        'date_limite',
        'statut',
        'retard_jours',
        'date_cloture',
        'id_responsable',
        'id_approbateur',
    ];

    protected function casts(): array
    {
        return [
            'date_debut'   => 'date',
            'date_limite'  => 'date',
            'date_cloture' => 'date',
            'retard_jours' => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Activité à laquelle appartient cette tâche */
    public function activite(): BelongsTo
    {
        return $this->belongsTo(Activite::class, 'id_activite');
    }

    /** Responsable RACI (R) — obligatoire */
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_responsable');
    }

    /** Approbateur RACI (A) — optionnel */
    public function approbateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_approbateur');
    }

    /** Entrées RACI secondaires (Consulté / Informé) */
    public function racis(): HasMany
    {
        return $this->hasMany(TacheRaci::class, 'id_tache');
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /** Indique si la tâche est en retard par rapport à sa date limite */
    public function getEstEnRetardAttribute(): bool
    {
        if ($this->statut === 'terminee' || $this->statut === 'archivee') {
            return false;
        }

        return now()->toDateString() > $this->date_limite?->toDateString();
    }
}
