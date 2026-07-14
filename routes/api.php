<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes API — ISFAD-Gouvernance
|--------------------------------------------------------------------------
|
| Routes publiques  : soumises au rate limiter "auth" (5 req/min par IP).
| Routes protégées  : middleware auth:sanctum + rate limiter "api" (60/min).
|
*/

// ── Routes publiques (non authentifiées) ──────────────────────────────────────
// Rate limiter strict : 5 tentatives par minute par IP (anti brute-force)
Route::middleware('throttle:auth')->group(function (): void {

    /**
     * POST /api/login
     * Authentification : retourne un jeton Bearer Sanctum.
     * Body: email, mot_de_passe
     */
    Route::post('/login', [AuthController::class, 'login']);

    /**
     * POST /api/forgot-password & /api/reset-password
     * Récupération de mot de passe.
     */
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// ── Routes protégées (authentification Sanctum requise) ───────────────────────
// Rate limiter standard : 60 requêtes par minute par utilisateur
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {

    /**
     * GET /api/me
     * Retourne les informations de l'utilisateur connecté.
     */
    Route::get('/me', [AuthController::class, 'me']);
    
    /**
     * PUT /api/me
     * Met à jour le profil (nom, prenom, telephone).
     */
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);
    Route::post('/me/photo', [AuthController::class, 'updatePhoto']);

    // ── Routes Notifications ───────────────────────────────────────────────────
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'marquerLue']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'marquerToutesLues']);

    /**
     * POST /api/logout
     * Révoque le jeton d'accès actuel (déconnexion de l'appareil courant).
     */
    Route::post('/logout', [AuthController::class, 'logout']);

    /**
     * POST /api/logout-all
     * Révoque TOUS les jetons de l'utilisateur (déconnexion sur tous les appareils).
     */
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    /**
     * POST /api/change-password
     * Changement de mot de passe.
     * Obligatoire lors de la première connexion (premiere_connexion = true).
     * Body: mot_de_passe_actuel, nouveau_mot_de_passe, nouveau_mot_de_passe_confirmation
     */
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    /**
     * Routes Administration
     */
    Route::middleware('admin')->group(function () {
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::patch('/admin/users/{id}/statut', [AdminUserController::class, 'updateStatut']);
        
        Route::get('/admin/audits', [\App\Http\Controllers\AuditController::class, 'index']);
        Route::get('/admin/configurations', [\App\Http\Controllers\ConfigurationController::class, 'index']);
        Route::put('/admin/configurations/{cle}', [\App\Http\Controllers\ConfigurationController::class, 'update']);
    });

    // ── Routes Utilisateurs ────────────────────────────────────────────────────
    Route::get('/utilisateurs', [\App\Http\Controllers\UtilisateurController::class, 'index']);

    // ── Routes Dashboard & Configurations ──────────────────────────────────────
    Route::get('/dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);

    // ── Routes Projets ─────────────────────────────────────────────────────────
    Route::get('/projets', [\App\Http\Controllers\ProjetController::class, 'index']);
    Route::post('/projets/initier', [\App\Http\Controllers\ProjetController::class, 'initier']);
    Route::post('/projets/{id}/transmettre-chef', [\App\Http\Controllers\ProjetController::class, 'transmettreChef']);
    Route::post('/projets', [\App\Http\Controllers\ProjetController::class, 'store']);
    Route::get('/projets/{id}', [\App\Http\Controllers\ProjetController::class, 'show']);
    Route::put('/projets/{id}', [\App\Http\Controllers\ProjetController::class, 'update']);
    Route::patch('/projets/{id}/etat-spse', [\App\Http\Controllers\ProjetController::class, 'updateEtatSpse']);
    Route::post('/projets/{id}/transmettre', [\App\Http\Controllers\ProjetController::class, 'transmettre']);
    Route::patch('/projets/{id}/archiver', [\App\Http\Controllers\ProjetController::class, 'archiver']);

    // ── Module 2 : Gestion des Équipes ─────────────────────────────────────────
    // Lister les utilisateurs disponibles (non encore membres) — pour les selects du front
    Route::get('/utilisateurs/disponibles', [\App\Http\Controllers\EquipeController::class, 'utilisateursDispo']);
    // CRUD équipe d'un projet
    Route::get('/projets/{id}/equipe', [\App\Http\Controllers\EquipeController::class, 'index']);
    Route::post('/projets/{id}/equipe', [\App\Http\Controllers\EquipeController::class, 'store']);
    Route::patch('/projets/{id}/equipe/{participationId}', [\App\Http\Controllers\EquipeController::class, 'updateRole']);
    Route::delete('/projets/{id}/equipe/{participationId}', [\App\Http\Controllers\EquipeController::class, 'destroy']);
    // Réaffectation du responsable d'une tâche (avec vérif membership)
    Route::patch('/taches/{id}/responsable', [\App\Http\Controllers\EquipeController::class, 'reaffecterResponsable']);

    // ── Routes Phases ──────────────────────────────────────────────────────────
    Route::post('/projets/{id}/phases', [\App\Http\Controllers\PhaseController::class, 'store']);
    Route::put('/phases/{id}', [\App\Http\Controllers\PhaseController::class, 'update']);
    Route::patch('/phases/{id}/statut', [\App\Http\Controllers\PhaseController::class, 'updateStatut']);

    // ── Routes Jalons ──────────────────────────────────────────────────────────
    Route::post('/projets/{id}/jalons', [\App\Http\Controllers\JalonController::class, 'store']);
    Route::put('/jalons/{id}', [\App\Http\Controllers\JalonController::class, 'update']);
    Route::delete('/jalons/{id}', [\App\Http\Controllers\JalonController::class, 'destroy']);

    // ── Routes Activités ───────────────────────────────────────────────────────
    Route::post('/projets/{id}/activites', [\App\Http\Controllers\ActiviteController::class, 'store']);
    Route::put('/activites/{id}', [\App\Http\Controllers\ActiviteController::class, 'update']);
    Route::delete('/activites/{id}', [\App\Http\Controllers\ActiviteController::class, 'destroy']);

    // ── Routes Budget & Dépenses ───────────────────────────────────────────────    // Budget
    Route::get('/projets/{id}/budget', [\App\Http\Controllers\BudgetController::class, 'show']);
    Route::post('/projets/{id}/budget', [\App\Http\Controllers\BudgetController::class, 'storeOrUpdate']);

    // Rapports
    Route::get('/projets/{projetId}/rapports', [\App\Http\Controllers\RapportController::class, 'index']);
    Route::post('/projets/{projetId}/rapports', [\App\Http\Controllers\RapportController::class, 'store']);
    Route::get('/rapports/{id}/commentaires', [\App\Http\Controllers\RapportCommentaireController::class, 'index']);
    Route::post('/rapports/{id}/commentaires', [\App\Http\Controllers\RapportCommentaireController::class, 'store']);
    Route::post('/budgets/{id}/depenses', [\App\Http\Controllers\DepenseController::class, 'store']);
    Route::patch('/depenses/{id}/valider', [\App\Http\Controllers\DepenseController::class, 'valider']);

    // ── Routes Demandes de Changement ──────────────────────────────────────────
    Route::get('/demandes-changements', [\App\Http\Controllers\DemandeChangementController::class, 'index']);
    Route::post('/demandes-changements', [\App\Http\Controllers\DemandeChangementController::class, 'store']);
    Route::patch('/demandes-changements/{id}/statut', [\App\Http\Controllers\DemandeChangementController::class, 'updateStatut']);

    // ── Routes Tâches et RACI ──────────────────────────────────────────────────
    Route::get('/mes-taches', [\App\Http\Controllers\TacheController::class, 'mesTaches']);
    Route::post('/taches', [\App\Http\Controllers\TacheController::class, 'store']);
    Route::put('/taches/{id}', [\App\Http\Controllers\TacheController::class, 'update']);
    Route::patch('/taches/{id}/statut', [\App\Http\Controllers\TacheController::class, 'updateStatut']);
    Route::post('/taches/{id}/raci', [\App\Http\Controllers\TacheController::class, 'assignRaci']);

    // Commentaires Privés (Responsable / Approbateur)
    Route::get('/taches/{id}/commentaires', [\App\Http\Controllers\TacheCommentaireController::class, 'index']);
    Route::post('/taches/{id}/commentaires', [\App\Http\Controllers\TacheCommentaireController::class, 'store']);

    // ── Routes Réunions et Demandes ───────────────────────────────────────────
    Route::get('/reunions/mes-reunions', [\App\Http\Controllers\ReunionController::class, 'index']);
    Route::get('/reunions/demandes', [\App\Http\Controllers\ReunionController::class, 'demandes']);
    Route::post('/reunions', [\App\Http\Controllers\ReunionController::class, 'store']);
    Route::patch('/reunions/{id}/valider', [\App\Http\Controllers\ReunionController::class, 'valider']);


    // ── Calendrier Global ─────────────────────────────────────────────────────
    Route::get('/calendrier', [\App\Http\Controllers\CalendrierController::class, 'index']);
});
