<?php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Middleware Sanctum pour l'authentification stateful (SPA cookies)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toutes les erreurs sur /api/* sont retournées en JSON
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // 404 sur les routes API → JSON propre au lieu d'une page HTML
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Ressource introuvable.',
                ], 404);
            }
        });
    })
    ->booted(function (): void {
        // ── Rate Limiters ──────────────────────────────────────────────────────

        /**
         * Limiteur pour les routes d'authentification (login/register).
         * Max 5 tentatives par minute par adresse IP.
         * Protège contre les attaques brute-force.
         */
        RateLimiter::for('auth', function (Request $request): Limit {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(fn () => response()->json([
                    'message' => 'Trop de tentatives. Veuillez réessayer dans une minute.',
                ], 429));
        });

        /**
         * Limiteur général pour les routes API authentifiées.
         * Max 60 requêtes par minute par utilisateur (ou IP si non connecté).
         */
        RateLimiter::for('api', function (Request $request): Limit {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip());
        });
    })
    ->create();
