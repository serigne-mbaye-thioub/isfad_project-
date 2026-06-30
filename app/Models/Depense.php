<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Depense — Dépense imputée sur le budget d'un projet.
 *
 * Chaque dépense est liée à un budget et créée par un utilisateur.
 * Le champ `justificatif` contient le chemin vers le fichier justificatif.
 */
class Depense extends Model
{
    use HasFactory;

    protected $table = 'depenses';

    protected $fillable = [
        'id_budget',
        'libelle',
        'montant',
        'categorie',
        'date_depense',
        'statut',
        'justificatif',
        'note',
        'id_createur',
    ];

    protected function casts(): array
    {
        return [
            'montant'       => 'decimal:2',
            'date_depense'  => 'date',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Budget sur lequel est imputée cette dépense */
    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'id_budget');
    }

    /** Utilisateur qui a enregistré cette dépense */
    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_createur');
    }
}
