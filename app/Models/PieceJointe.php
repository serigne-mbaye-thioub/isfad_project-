<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PieceJointe — Fichier attaché à une entité du système.
 *
 * Utilise un système de référence polymorphe manuel (type_cible + id_cible)
 * pour attacher des fichiers à un projet, une tâche, une réunion
 * ou une demande de changement.
 *
 * Le stockage physique est géré par le filesystem Laravel (FILESYSTEM_DISK).
 * `nom_stockage` contient le nom unique en stockage (format UUID + extension).
 * `url_acces` contient l'URL publique ou signée d'accès au fichier.
 */
class PieceJointe extends Model
{
    use HasFactory;

    protected $table = 'piece_jointes';

    protected $fillable = [
        'type_cible',
        'id_cible',
        'nom_fichier',
        'nom_stockage',
        'type_mime',
        'taille_octets',
        'url_acces',
        'id_deposant',
    ];

    protected function casts(): array
    {
        return [
            'id_cible'      => 'integer',
            'taille_octets' => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Utilisateur ayant déposé ce fichier */
    public function deposant(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_deposant');
    }

    // ─── Résolution polymorphe manuelle ───────────────────────────────────────

    /**
     * Retourne l'entité cible selon son type.
     * Types supportés : projet, tache, reunion, demande_changement
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function getCible(): ?Model
    {
        return match ($this->type_cible) {
            'projet'             => Projet::find($this->id_cible),
            'tache'              => Tache::find($this->id_cible),
            'reunion'            => Reunion::find($this->id_cible),
            'demande_changement' => DemandeChangement::find($this->id_cible),
            default              => null,
        };
    }

    // ─── Accesseurs ───────────────────────────────────────────────────────────

    /** Taille formatée lisible (Ko, Mo) */
    public function getTailleFormateeAttribute(): string
    {
        $octets = $this->taille_octets;

        if ($octets >= 1_048_576) {
            return round($octets / 1_048_576, 2) . ' Mo';
        }

        return round($octets / 1_024, 2) . ' Ko';
    }
}
