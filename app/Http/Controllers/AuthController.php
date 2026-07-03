<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Mail\ResetPasswordMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
        // Si l'utilisateur n'existe pas, on hash une chaîne factice pour prendre le même temps
        // que s'il existait, empêchant ainsi l'énumération des emails via l'analyse du temps de réponse.
        if (! $utilisateur) {
            Hash::check($request->mot_de_passe, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
            $motDePasseValide = false;
        } else {
            $motDePasseValide = Hash::check($request->mot_de_passe, $utilisateur->mot_de_passe);
        }

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
                    ->when(! app()->environment('testing'), fn ($rule) => $rule->uncompromised()),
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

    /**
     * Demande de réinitialisation de mot de passe (Envoi du code)
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:utilisateurs,email']);
        
        // Code à 6 chiffres
        $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );
        
        Mail::to($request->email)->send(new ResetPasswordMail($token));
        
        return response()->json(['message' => 'Un code de sécurité a été envoyé à votre adresse e-mail.']);
    }

    /**
     * Validation du code et changement du mot de passe
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:utilisateurs,email',
            'token' => 'required|string',
            'mot_de_passe' => 'required|string|min:8|confirmed'
        ]);

        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetToken || now()->diffInMinutes($resetToken->created_at) > 60) {
            return response()->json(['message' => 'Le code de sécurité est invalide ou expiré.'], 400);
        }

        $user = Utilisateur::where('email', $request->email)->first();
        $user->mot_de_passe = bcrypt($request->mot_de_passe);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Votre mot de passe a été réinitialisé avec succès.']);
    }

    /**
     * Mise à jour du profil de l'utilisateur connecté
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'nom' => 'string|max:100',
            'prenom' => 'string|max:100',
            'telephone' => 'nullable|string|max:20',
        ]);
        
        $user->update($validated);
        
        return response()->json(['message' => 'Profil mis à jour avec succès.', 'user' => $user]);
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
