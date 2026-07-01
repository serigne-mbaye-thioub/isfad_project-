<?php

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
     * POST /api/register
     * Inscription d'un nouvel utilisateur.
     * Body: nom, prenom, email, mot_de_passe, mot_de_passe_confirmation, telephone?, fonction?
     */
    Route::post('/register', [AuthController::class, 'register']);

    /**
     * POST /api/login
     * Authentification : retourne un jeton Bearer Sanctum.
     * Body: email, mot_de_passe
     */
    Route::post('/login', [AuthController::class, 'login']);
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
});
