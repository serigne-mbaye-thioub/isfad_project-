<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * NotificationDestinataire — Lien entre une notification et un destinataire.
 *
 * Gère l'état de lecture (est_lue, date_lecture) pour chaque paire
 * notification / utilisateur. Un utilisateur ne peut être destinataire
 * qu'une seule fois par notification (contrainte unique en BDD).
 */
class NotificationDestinataire extends Model
{
    use HasFactory;

    protected $table = 'notification_destinataires';

    protected $fillable = [
        'id_notification',
        'id_utilisateur',
        'est_lue',
        'date_lecture',
    ];

    protected function casts(): array
    {
        return [
            'est_lue'       => 'boolean',
            'date_lecture'  => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /**
     * Notification associée.
     * Utilise App\Models\Notification (système personnalisé ISFAD).
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class, 'id_notification');
    }

    /** Utilisateur destinataire */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    // ─── Méthodes métier ──────────────────────────────────────────────────────

    /** Marque la notification comme lue avec la date et heure actuelles */
    public function marquerCommeLue(): bool
    {
        return $this->update([
            'est_lue'      => true,
            'date_lecture' => now(),
        ]);
    }
}
