<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ParticipationProjet — Table pivot enrichie entre Utilisateur et Projet.
 *
 * Gère le rôle contextuel de chaque membre au sein d'un projet spécifique,
 * ainsi que la date d'affectation et le statut de participation.
 */
class ParticipationProjet extends Model
{
    use HasFactory;

    protected $table = 'participation_projets';

    protected $fillable = [
        'id_utilisateur',
        'id_projet',
        'role_projet',
        'date_affectation',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'date_affectation' => 'date',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Utilisateur participant */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    /** Projet auquel l'utilisateur participe */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }
}
