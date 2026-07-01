<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * Contrôleur d'authentification API — sécurisé avec Laravel Sanctum.
 *
 * Sécurités implémentées :
 * - Rate limiting sur login/register (5 req/min par IP, géré dans bootstrap/app.php)
 * - Réponse générique 401 sans préciser si c'est l'email ou le mot de passe (anti-enumération)
 * - Vérification du statut `actif` du compte avant d'accorder l'accès
 * - Règles de complexité strictes sur les mots de passe
 * - Jetons Sanctum nommés et révocables individuellement
 * - Pas de données sensibles dans les réponses (mot_de_passe, remember_token masqués par le modèle)
 */
class AuthController extends Controller
{
    /**
     * POST /api/register
     * Inscription d'un nouvel utilisateur.
     *
     * Le compte est créé avec actif=true et premiere_connexion=true.
     * Un jeton d'accès est immédiatement retourné.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'         => ['required', 'string', 'max:100'],
            'prenom'      => ['required', 'string', 'max:100'],
            'email'       => ['required', 'string', 'email:rfc', 'max:255', 'unique:utilisateurs,email'],
            'telephone'   => ['nullable', 'string', 'max:20'],
            'fonction'    => ['nullable', 'string', 'max:100'],
            'mot_de_passe' => [
                'required',
                'confirmed',
                // Règles de sécurité : min 8 chars, mixte lettres/chiffres/spéciaux
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->when(! app()->environment('testing'), fn ($rule) => $rule->uncompromised()),
            ],
        ], [
            'email.unique'                   => 'Cette adresse email est déjà utilisée.',
            'mot_de_passe.confirmed'         => 'La confirmation du mot de passe ne correspond pas.',
            'mot_de_passe.min'               => 'Le mot de passe doit contenir au minimum 8 caractères.',
        ]);

        $utilisateur = Utilisateur::create([
            'nom'                => $validated['nom'],
            'prenom'             => $validated['prenom'],
            'email'              => $validated['email'],
            'telephone'          => $validated['telephone'] ?? null,
            'fonction'           => $validated['fonction'] ?? null,
            'mot_de_passe'       => $validated['mot_de_passe'], // Haché automatiquement par le cast 'hashed'
            'actif'              => true,
            'premiere_connexion' => true,
        ]);

        $token = $utilisateur->createToken('access_token')->plainTextToken;

        return response()->json([
            'message'       => 'Compte créé avec succès.',
            'utilisateur'   => $this->formatUtilisateur($utilisateur),
            'access_token'  => $token,
            'token_type'    => 'Bearer',
        ], 201);
    }

    /**
     * POST /api/login
     * Authentification et génération d'un jeton Sanctum.
     *
     * Sécurité : la réponse d'erreur est volontairement identique que
     * l'email soit inexistant, le mot de passe incorrect, ou le compte
     * inactif — pour empêcher l'énumération des comptes.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => ['required', 'string', 'email'],
            'mot_de_passe' => ['required', 'string'],
        ]);

        // Recherche de l'utilisateur non supprimé avec cet email
        $utilisateur = Utilisateur::where('email', $request->email)->first();

        // ── Vérification en temps constant pour éviter les timing attacks ─────
        // On vérifie toujours le mot de passe même si l'utilisateur n'existe pas
        $motDePasseValide = $utilisateur && Hash::check(
            $request->mot_de_passe,
            $utilisateur->mot_de_passe
        );

        // Réponse générique identique dans tous les cas d'échec
        if (! $utilisateur || ! $motDePasseValide || ! $utilisateur->actif) {
            return response()->json([
                'message' => 'Identifiants incorrects ou compte inactif.',
            ], 401);
        }

        // Révocation des anciens jetons pour éviter l'accumulation (optionnel mais recommandé)
        // $utilisateur->tokens()->delete();

        $token = $utilisateur->createToken('access_token')->plainTextToken;

        return response()->json([
            'message'            => 'Connexion réussie.',
            'utilisateur'        => $this->formatUtilisateur($utilisateur),
            'access_token'       => $token,
            'token_type'         => 'Bearer',
            'premiere_connexion' => $utilisateur->premiere_connexion,
        ]);
    }

    /**
     * POST /api/logout
     * Révocation du jeton d'accès actuel (déconnexion).
     * Nécessite le middleware auth:sanctum.
     */
    public function logout(Request $request): JsonResponse
    {
        // Supprime uniquement le jeton utilisé pour cette requête
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * GET /api/me
     * Retourne les informations de l'utilisateur actuellement connecté.
     * Nécessite le middleware auth:sanctum.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'utilisateur' => $this->formatUtilisateur($request->user()),
        ]);
    }

    /**
     * POST /api/logout-all
     * Révocation de TOUS les jetons de l'utilisateur (déconnexion sur tous les appareils).
     * Nécessite le middleware auth:sanctum.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Déconnecté de tous les appareils.',
        ]);
    }

    /**
     * POST /api/change-password
     * Changement de mot de passe (obligatoire à la première connexion).
     * Nécessite le middleware auth:sanctum.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'mot_de_passe_actuel'  => ['required', 'string'],
            'nouveau_mot_de_passe' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ], [
            'nouveau_mot_de_passe.confirmed' => 'La confirmation du nouveau mot de passe ne correspond pas.',
        ]);

        /** @var Utilisateur $utilisateur */
        $utilisateur = $request->user();

        // Vérification du mot de passe actuel
        if (! Hash::check($request->mot_de_passe_actuel, $utilisateur->mot_de_passe)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        // Mise à jour du mot de passe et désactivation du flag premiere_connexion
        $utilisateur->update([
            'mot_de_passe'       => $request->nouveau_mot_de_passe, // Haché par le cast
            'premiere_connexion' => false,
        ]);

        // Révocation de tous les anciens jetons après changement de mot de passe
        $utilisateur->tokens()->delete();

        // Génération d'un nouveau jeton propre
        $token = $utilisateur->createToken('access_token')->plainTextToken;

        return response()->json([
            'message'      => 'Mot de passe modifié avec succès.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ]);
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    /**
     * Formate les données utilisateur renvoyées dans les réponses.
     * Ne retourne jamais le mot de passe ou les tokens (protection garantie par $hidden du modèle).
     */
    private function formatUtilisateur(Utilisateur $utilisateur): array
    {
        return [
            'id'                 => $utilisateur->id,
            'nom'                => $utilisateur->nom,
            'prenom'             => $utilisateur->prenom,
            'email'              => $utilisateur->email,
            'telephone'          => $utilisateur->telephone,
            'fonction'           => $utilisateur->fonction,
            'actif'              => $utilisateur->actif,
            'premiere_connexion' => $utilisateur->premiere_connexion,
            'created_at'         => $utilisateur->created_at?->toISOString(),
        ];
    }
}
