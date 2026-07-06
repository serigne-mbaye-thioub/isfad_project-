<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Utilisateur — Table d'authentification et de gestion des acteurs du système.
 *
 * Note : Ce modèle utilise le champ `mot_de_passe` à la place du `password`
 * conventionnel de Laravel. La méthode getAuthPasswordName() est surchargée
 * pour en informer le système d'authentification.
 */
class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, \App\Traits\Auditable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'mot_de_passe',
        'fonction',
        'actif',
        'premiere_connexion',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'actif'              => 'boolean',
            'premiere_connexion' => 'boolean',
            'mot_de_passe'       => 'hashed',
        ];
    }

    // ─── Surcharge Auth ───────────────────────────────────────────────────────

    /**
     * Retourne le nom de colonne du mot de passe utilisé par Laravel Auth.
     * Override nécessaire car le champ est `mot_de_passe` et non `password`.
     */
    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe';
    }

    // ─── RBAC & Hiérarchie des Rôles ──────────────────────────────────────────

    /**
     * Chaîne d'héritage des rôles métiers (du plus haut au plus bas).
     * Les rôles non listés ici (Administrateur, Partenaire, etc.) sont indépendants.
     */
    public const HIERARCHY = [
        'Superviseur'            => 30,
        'Chef de projet'         => 20,
        'Gestionnaire de projet' => 10,
    ];

    /**
     * Vérifie si l'utilisateur possède un rôle spécifique ou un rôle supérieur dans la hiérarchie.
     */
    public function hasRole(string $requiredRole): bool
    {
        // 1. Un Administrateur a tous les droits par défaut
        if ($this->isAdminGlobally()) {
            return true;
        }

        // 2. Si le rôle correspond exactement, c'est OK
        if ($this->fonction === $requiredRole) {
            return true;
        }

        // 3. Si le rôle demandé fait partie de la hiérarchie
        if (isset(self::HIERARCHY[$requiredRole])) {
            $requiredLevel = self::HIERARCHY[$requiredRole];
            $userLevel = self::HIERARCHY[$this->fonction] ?? 0;
            
            return $userLevel >= $requiredLevel;
        }

        return false;
    }

    /**
     * Raccourci pour vérifier si l'utilisateur est un Admin global.
     */
    public function isAdminGlobally(): bool
    {
        return in_array($this->fonction, ['Administrateur', 'Administrateur système']);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /** Projets créés/initiés par cet utilisateur */
    public function projetsCreés(): HasMany
    {
        return $this->hasMany(Projet::class, 'id_createur');
    }

    /**
     * Participations directes à des projets.
     * Utiliser cette relation pour accéder au rôle et statut d'affectation.
     */
    public function participations(): HasMany
    {
        return $this->hasMany(ParticipationProjet::class, 'id_utilisateur');
    }

    /**
     * Projets auxquels cet utilisateur participe (accès via table pivot).
     * Inclut le rôle et le statut d'affectation dans le pivot.
     */
    public function projets(): BelongsToMany
    {
        return $this->belongsToMany(
            Projet::class,
            'participation_projets',
            'id_utilisateur',
            'id_projet'
        )->withPivot(['role_projet', 'date_affectation', 'statut'])
         ->withTimestamps();
    }

    /** Activités dont cet utilisateur est responsable */
    public function activitesResponsable(): HasMany
    {
        return $this->hasMany(Activite::class, 'id_responsable');
    }

    /** Tâches dont cet utilisateur est responsable (R du RACI) */
    public function tachesResponsable(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_responsable');
    }

    /** Tâches dont cet utilisateur est approbateur (A du RACI) */
    public function tachesApprobateur(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_approbateur');
    }

    /** Rôles RACI secondaires (Consulté/Informé) assignés à cet utilisateur */
    public function tacheRacis(): HasMany
    {
        return $this->hasMany(TacheRaci::class, 'id_utilisateur');
    }

    /** Dépenses enregistrées par cet utilisateur */
    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class, 'id_createur');
    }

    /** Réunions dont cet utilisateur est l'organisateur */
    public function reunionsOrganisées(): HasMany
    {
        return $this->hasMany(Reunion::class, 'id_organisateur');
    }

    /** Notifications émises par cet utilisateur (NULL = système) */
    public function notificationsEmises(): HasMany
    {
        return $this->hasMany(Notification::class, 'id_emetteur');
    }

    /** Notifications reçues par cet utilisateur */
    public function notificationsRecues(): HasMany
    {
        return $this->hasMany(NotificationDestinataire::class, 'id_utilisateur');
    }

    /** Demandes de changement soumises par cet utilisateur */
    public function demandesChangement(): HasMany
    {
        return $this->hasMany(DemandeChangement::class, 'id_demandeur');
    }

    /** Rapports rédigés par cet utilisateur */
    public function rapports(): HasMany
    {
        return $this->hasMany(Rapport::class, 'id_auteur');
    }

    /** Pièces jointes déposées par cet utilisateur */
    public function piecesJointes(): HasMany
    {
        return $this->hasMany(PieceJointe::class, 'id_deposant');
    }
}
