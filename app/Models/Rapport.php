<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Rapport — Rapport généré sur une entité du système.
 *
 * Utilise un système de référence polymorphe manuel (type_cible + id_cible)
 * pour cibler un projet, une tâche ou une réunion.
 * Peut être publié ou gardé en brouillon (est_publie).
 */
class Rapport extends Model
{
    use HasFactory;

    protected $table = 'rapports';

    protected $fillable = [
        'type_cible',
        'id_cible',
        'titre',
        'type_rapport',
        'contenu',
        'format_export',
        'url_export',
        'id_auteur',
        'est_publie',
    ];

    protected function casts(): array
    {
        return [
            'id_cible'   => 'integer',
            'est_publie' => 'boolean',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Utilisateur auteur de ce rapport */
    public function auteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_auteur');
    }

    /** Utilisateurs ciblés pour lire ce rapport */
    public function destinataires()
    {
        return $this->belongsToMany(Utilisateur::class, 'rapport_destinataires', 'rapport_id', 'utilisateur_id')->withTimestamps();
    }

    /** Commentaires laissés sur ce rapport */
    public function commentaires()
    {
        return $this->hasMany(RapportCommentaire::class, 'rapport_id')->orderBy('created_at', 'asc');
    }

    // ─── Résolution polymorphe manuelle ───────────────────────────────────────

    /**
     * Retourne l'entité cible du rapport selon son type.
     * Types supportés : projet, tache, reunion
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function getCible(): ?Model
    {
        return match ($this->type_cible) {
            'projet'  => Projet::find($this->id_cible),
            'tache'   => Tache::find($this->id_cible),
            'reunion' => Reunion::find($this->id_cible),
            default   => null,
        };
    }
}
