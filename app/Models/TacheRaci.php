<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TacheRaci — Table des rôles RACI secondaires d'une tâche.
 *
 * Gère uniquement les rôles Consulté (C) et Informé (I).
 * Le Responsable (R) et l'Approbateur (A) sont stockés directement
 * sur la table `taches` (colonnes id_responsable et id_approbateur).
 */
class TacheRaci extends Model
{
    use HasFactory;

    protected $table = 'tache_racis';

    protected $fillable = [
        'id_tache',
        'id_utilisateur',
        'role_raci',
    ];

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Tâche concernée par cette entrée RACI */
    public function tache(): BelongsTo
    {
        return $this->belongsTo(Tache::class, 'id_tache');
    }

    /** Utilisateur assigné à ce rôle RACI */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
