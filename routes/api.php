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
     * POST /api/admin/users
     * Création de compte utilisateur par l'administrateur.
     * Body: nom, prenom, email, telephone?, fonction
     */
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::patch('/admin/users/{id}/statut', [AdminUserController::class, 'updateStatut']);

    // ── Routes Dashboard & Configurations ──────────────────────────────────────
    Route::get('/admin/dashboard/stats', [\App\Http\Controllers\AdminDashboardController::class, 'stats']);
    Route::get('/admin/configurations', [\App\Http\Controllers\ConfigurationController::class, 'index']);
    Route::put('/admin/configurations/{cle}', [\App\Http\Controllers\ConfigurationController::class, 'update']);

    // ── Routes Projets ─────────────────────────────────────────────────────────
    Route::get('/projets', [\App\Http\Controllers\ProjetController::class, 'index']);
    Route::post('/projets', [\App\Http\Controllers\ProjetController::class, 'store']);
    Route::get('/projets/{id}', [\App\Http\Controllers\ProjetController::class, 'show']);
    Route::post('/projets/{id}/membres', [\App\Http\Controllers\ProjetController::class, 'addMembre']);
    Route::put('/projets/{id}', [\App\Http\Controllers\ProjetController::class, 'update']);
    Route::patch('/projets/{id}/etat-spse', [\App\Http\Controllers\ProjetController::class, 'updateEtatSpse']);

    // ── Routes Phases ──────────────────────────────────────────────────────────
    Route::post('/projets/{id}/phases', [\App\Http\Controllers\PhaseController::class, 'store']);
    Route::put('/phases/{id}', [\App\Http\Controllers\PhaseController::class, 'update']);
    Route::patch('/phases/{id}/statut', [\App\Http\Controllers\PhaseController::class, 'updateStatut']);

    // ── Routes Activités ───────────────────────────────────────────────────────
    Route::post('/phases/{id}/activites', [\App\Http\Controllers\ActiviteController::class, 'store']);
    Route::put('/activites/{id}', [\App\Http\Controllers\ActiviteController::class, 'update']);
    Route::delete('/activites/{id}', [\App\Http\Controllers\ActiviteController::class, 'destroy']);

    // ── Routes Tâches et RACI ──────────────────────────────────────────────────
    Route::post('/taches', [\App\Http\Controllers\TacheController::class, 'store']);
    Route::put('/taches/{id}', [\App\Http\Controllers\TacheController::class, 'update']);
    Route::patch('/taches/{id}/statut', [\App\Http\Controllers\TacheController::class, 'updateStatut']);
    Route::post('/taches/{id}/raci', [\App\Http\Controllers\TacheController::class, 'assignRaci']);

    // ── Routes Réunions et Demandes ───────────────────────────────────────────
    Route::get('/reunions/mes-reunions', [\App\Http\Controllers\ReunionController::class, 'index']);
    Route::get('/reunions/demandes', [\App\Http\Controllers\ReunionController::class, 'demandes']);
    Route::post('/reunions', [\App\Http\Controllers\ReunionController::class, 'store']);
    Route::patch('/reunions/{id}/valider', [\App\Http\Controllers\ReunionController::class, 'valider']);
});
