<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Projet — Entité centrale du système de gouvernance.
 *
 * Un projet possède un créateur, des phases, des membres participants,
 * des jalons, des réunions et un budget unique.
 */
class Projet extends Model
{
    use HasFactory, \App\Traits\Auditable, SoftDeletes;

    protected $table = 'projets';

    protected $fillable = [
        'titre',
        'description',
        'date_debut',
        'date_fin',
        'priorite',
        'statut',
        'etat_spse',
        'avancement',
        'id_createur',
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

    /** Utilisateur qui a créé/initié ce projet */
    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_createur');
    }

    /** Phases du projet (ordonnées par ordre croissant) */
    public function phases(): HasMany
    {
        return $this->hasMany(Phase::class, 'id_projet')->orderBy('ordre');
    }

    /**
     * Membres du projet avec leurs rôles (accès direct à la table pivot).
     * Utiliser membres() pour accéder aux Utilisateur via belongsToMany.
     */
    public function participations(): HasMany
    {
        return $this->hasMany(ParticipationProjet::class, 'id_projet');
    }

    /**
     * Membres du projet via la table pivot participation_projets.
     * Inclut le rôle et le statut d'affectation dans le pivot.
     */
    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'participation_projets',
            'id_projet',
            'id_utilisateur'
        )->withPivot(['role_projet', 'date_affectation', 'statut'])
         ->withTimestamps();
    }

    /** Jalons du projet */
    public function jalons(): HasMany
    {
        return $this->hasMany(Jalon::class, 'id_projet');
    }

    /** Tâches liées directement au projet (sans passer par une activité) */
    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_projet');
    }

    /** Réunions liées à ce projet */
    public function reunions(): HasMany
    {
        return $this->hasMany(Reunion::class, 'id_projet');
    }

    /** Budget unique du projet */
    public function budget(): HasOne
    {
        return $this->hasOne(Budget::class, 'id_projet');
    }
}
