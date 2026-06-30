<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Notification — Notification interne du système ISFAD-Gouvernance.
 *
 * ⚠️  IMPORTANT : Ce modèle est dans App\Models\Notification et utilise
 * la table `notifications` avec une structure PERSONNALISÉE, différente
 * de la table `notifications` du système de notification intégré de Laravel
 * (qui utilise: id uuid, type, notifiable_type, notifiable_id, data, read_at).
 *
 * Pour éviter toute confusion, ne PAS utiliser le driver `database` de
 * Laravel Notifications (->via('database')) avec ce modèle.
 *
 * Les destinataires sont gérés dans la table `notification_destinataires`
 * via le modèle NotificationDestinataire.
 */
class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'type_evenement',
        'titre',
        'contenu',
        'type_cible',
        'id_cible',
        'id_emetteur',
    ];

    protected function casts(): array
    {
        return [
            'id_cible' => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /**
     * Utilisateur émetteur de la notification.
     * NULL si la notification est générée automatiquement par le système.
     */
    public function emetteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_emetteur');
    }

    /** Destinataires de cette notification */
    public function destinataires(): HasMany
    {
        return $this->hasMany(NotificationDestinataire::class, 'id_notification');
    }
}
