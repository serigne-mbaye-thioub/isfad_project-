<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Reunion — Réunion de travail liée ou non à un projet.
 *
 * Une réunion peut être totalement indépendante d'un projet (id_projet NULL)
 * ou rattachée à un projet spécifique.
 *
 * Note : La gestion des participants est implicite (membres du projet)
 * ou à gérer via une table dédiée à ajouter si nécessaire.
 */
class Reunion extends Model
{
    use HasFactory;

    protected $table = 'reunions';

    protected $fillable = [
        'id_projet',
        'titre',
        'ordre_du_jour',
        'lieu',
        'date_reunion',
        'duree_minutes',
        'compte_rendu',
        'statut',
        'id_organisateur',
    ];

    protected function casts(): array
    {
        return [
            'date_reunion'  => 'datetime',
            'duree_minutes' => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /**
     * Projet auquel est rattachée cette réunion (optionnel).
     * NULL si la réunion est indépendante de tout projet.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }

    /** Utilisateur qui organise cette réunion */
    public function organisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_organisateur');
    }

    /** Les participants invités à cette réunion */
    public function participants()
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'participation_reunions',
            'id_reunion',
            'id_utilisateur'
        )->withPivot('statut_presence')->withTimestamps();
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /** Heure de fin estimée de la réunion */
    public function getHeureFin(): ?\Carbon\Carbon
    {
        if ($this->date_reunion && $this->duree_minutes) {
            return $this->date_reunion->copy()->addMinutes($this->duree_minutes);
        }

        return null;
    }
}
