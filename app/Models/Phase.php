<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Phase — Étape structurante du cycle de vie d'un projet.
 *
 * Un projet est découpé en phases ordonnées (initialisation, planification,
 * exécution, suivi, clôture). Chaque phase contient des activités.
 */
class Phase extends Model
{
    use HasFactory;

    protected $table = 'phases';

    protected $fillable = [
        'id_projet',
        'nom',
        'description',
        'date_debut',
        'date_fin',
        'statut',
        'ordre',
        'avancement',
    ];

    protected function casts(): array
    {
        return [
            'date_debut'  => 'date',
            'date_fin'    => 'date',
            'avancement'  => 'decimal:2',
            'ordre'       => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Projet auquel appartient cette phase */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet');
    }

    /** Activités contenues dans cette phase */
    public function activites(): HasMany
    {
        return $this->hasMany(Activite::class, 'id_phase')->whereNull('id_jalon');
    }

    /** Jalons rattachés à cette phase (relation optionnelle) */
    public function jalons(): HasMany
    {
        return $this->hasMany(Jalon::class, 'id_phase');
    }
}
