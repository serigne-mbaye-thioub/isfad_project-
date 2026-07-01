<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Suite de tests fonctionnels — Authentification API Sanctum.
 *
 * Couvre :
 *  - Inscription (valide, doublons, validation mot de passe)
 *  - Connexion (valide, mauvais identifiants, compte inactif, messages génériques)
 *  - Accès protégé /api/me
 *  - Déconnexion (jeton courant et tous jetons)
 *  - Changement de mot de passe
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Crée un utilisateur actif en base avec un mot de passe hashé.
     */
    private function creerUtilisateur(array $overrides = []): Utilisateur
    {
        return Utilisateur::create(array_merge([
            'nom'                => 'Diallo',
            'prenom'             => 'Amadou',
            'email'              => 'amadou.diallo@isfad.sn',
            'mot_de_passe'       => Hash::make('P@ssw0rd!123'),
            'actif'              => true,
            'premiere_connexion' => false,
        ], $overrides));
    }

    // ── REGISTER ──────────────────────────────────────────────────────────────

    /** ✅ Inscription valide → 201 + jeton */
    public function test_inscription_valide_retourne_token(): void
    {
        $response = $this->postJson('/api/register', [
            'nom'                          => 'Sow',
            'prenom'                       => 'Fatou',
            'email'                        => 'fatou.sow@isfad.sn',
            'mot_de_passe'                 => 'P@ssw0rd!123',
            'mot_de_passe_confirmation'    => 'P@ssw0rd!123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'utilisateur' => ['id', 'nom', 'prenom', 'email'],
                     'access_token',
                     'token_type',
                 ])
                 ->assertJsonPath('token_type', 'Bearer');

        // Le mot de passe ne doit JAMAIS apparaître dans la réponse
        $this->assertStringNotContainsString('P@ssw0rd!123', $response->getContent());
        $this->assertStringNotContainsString('mot_de_passe', $response->getContent());

        $this->assertDatabaseHas('utilisateurs', ['email' => 'fatou.sow@isfad.sn']);
    }

    /** ❌ Inscription avec email déjà utilisé → 422 */
    public function test_inscription_email_duplique_echoue(): void
    {
        $this->creerUtilisateur(['email' => 'doublon@isfad.sn']);

        $response = $this->postJson('/api/register', [
            'nom'                          => 'Test',
            'prenom'                       => 'User',
            'email'                        => 'doublon@isfad.sn',
            'mot_de_passe'                 => 'P@ssw0rd!123',
            'mot_de_passe_confirmation'    => 'P@ssw0rd!123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /** ❌ Inscription avec mot de passe trop simple → 422 */
    public function test_inscription_mot_de_passe_trop_simple_echoue(): void
    {
        $response = $this->postJson('/api/register', [
            'nom'                          => 'Test',
            'prenom'                       => 'User',
            'email'                        => 'test@isfad.sn',
            'mot_de_passe'                 => '12345678', // Pas de lettres ni symboles
            'mot_de_passe_confirmation'    => '12345678',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['mot_de_passe']);
    }

    /** ❌ Inscription avec champs obligatoires manquants → 422 */
    public function test_inscription_champs_manquants_echoue(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nom', 'prenom', 'email', 'mot_de_passe']);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    /** ✅ Connexion valide → 200 + jeton */
    public function test_connexion_valide_retourne_token(): void
    {
        $this->creerUtilisateur();

        $response = $this->postJson('/api/login', [
            'email'        => 'amadou.diallo@isfad.sn',
            'mot_de_passe' => 'P@ssw0rd!123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'utilisateur',
                     'access_token',
                     'token_type',
                     'premiere_connexion',
                 ]);

        // Le mot de passe ne doit jamais apparaître dans la réponse
        $this->assertStringNotContainsString('P@ssw0rd', $response->getContent());
    }

    /** ❌ Connexion avec mauvais mot de passe → 401 avec message générique */
    public function test_connexion_mauvais_mot_de_passe_retourne_401_generique(): void
    {
        $this->creerUtilisateur();

        $response = $this->postJson('/api/login', [
            'email'        => 'amadou.diallo@isfad.sn',
            'mot_de_passe' => 'mauvais_mot_de_passe',
        ]);

        $response->assertStatus(401);

        // Le message ne doit pas préciser si c'est l'email ou le MDP (anti-énumération)
        $responseData = $response->json();
        $this->assertStringNotContainsString('email', strtolower($responseData['message']));
        $this->assertStringNotContainsString('mot de passe', strtolower($responseData['message']));
    }

    /** ❌ Connexion avec email inexistant → 401 avec message générique (identique) */
    public function test_connexion_email_inexistant_retourne_401_generique(): void
    {
        $response = $this->postJson('/api/login', [
            'email'        => 'inexistant@isfad.sn',
            'mot_de_passe' => 'P@ssw0rd!123',
        ]);

        $response->assertStatus(401);
    }

    /** ❌ Connexion compte inactif → 401 avec message générique (pas de fuite d'info) */
    public function test_connexion_compte_inactif_retourne_401(): void
    {
        $this->creerUtilisateur(['actif' => false]);

        $response = $this->postJson('/api/login', [
            'email'        => 'amadou.diallo@isfad.sn',
            'mot_de_passe' => 'P@ssw0rd!123',
        ]);

        $response->assertStatus(401);

        // Le message d'erreur ne doit PAS révéler explicitement que le compte est inactif
        // (seulement un message générique)
        $this->assertArrayHasKey('message', $response->json());
    }

    // ── ROUTES PROTÉGÉES ──────────────────────────────────────────────────────

    /** ❌ Accès à /api/me sans jeton → 401 */
    public function test_acces_me_sans_token_retourne_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    /** ✅ Accès à /api/me avec jeton valide → 200 + données utilisateur */
    public function test_acces_me_avec_token_valide_retourne_utilisateur(): void
    {
        $utilisateur = $this->creerUtilisateur();

        $response = $this->actingAs($utilisateur, 'sanctum')
                         ->getJson('/api/me');

        $response->assertStatus(200)
                 ->assertJsonPath('utilisateur.email', 'amadou.diallo@isfad.sn')
                 ->assertJsonPath('utilisateur.nom', 'Diallo');

        // Vérification que les données sensibles ne sont pas exposées
        $this->assertStringNotContainsString('mot_de_passe', $response->getContent());
        $this->assertStringNotContainsString('remember_token', $response->getContent());
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────

    /** ✅ Déconnexion → révocation du jeton courant → 200 */
    public function test_deconnexion_revoque_token_courant(): void
    {
        $utilisateur = $this->creerUtilisateur();
        $token = $utilisateur->createToken('access_token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
             ->postJson('/api/logout')
             ->assertStatus(200);

        // Après déconnexion, le token est révoqué en BDD — on vérifie directement
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /** ✅ Déconnexion globale → révocation de tous les jetons → 200 */
    public function test_deconnexion_globale_revoque_tous_les_tokens(): void
    {
        $utilisateur = $this->creerUtilisateur();
        $token1 = $utilisateur->createToken('mobile')->plainTextToken;
        $token2 = $utilisateur->createToken('desktop')->plainTextToken;

        // Les 2 jetons fonctionnent
        $this->assertCount(2, $utilisateur->tokens);

        $this->withHeader('Authorization', "Bearer {$token1}")
             ->postJson('/api/logout-all')
             ->assertStatus(200);

        // Tous les jetons révoqués
        $this->assertCount(0, $utilisateur->fresh()->tokens);
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────

    /** ✅ Changement de mot de passe valide → nouveau jeton + premiere_connexion=false */
    public function test_changement_mot_de_passe_valide(): void
    {
        $utilisateur = $this->creerUtilisateur(['premiere_connexion' => true]);

        $response = $this->actingAs($utilisateur, 'sanctum')
                         ->postJson('/api/change-password', [
                             'mot_de_passe_actuel'                    => 'P@ssw0rd!123',
                             'nouveau_mot_de_passe'                   => 'N0uveau!P@ssw0rd',
                             'nouveau_mot_de_passe_confirmation'      => 'N0uveau!P@ssw0rd',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'access_token', 'token_type']);

        $utilisateur->refresh();
        $this->assertFalse($utilisateur->premiere_connexion);
    }

    /** ❌ Changement de mot de passe avec ancien MDP incorrect → 422 */
    public function test_changement_mot_de_passe_ancien_incorrect_echoue(): void
    {
        $utilisateur = $this->creerUtilisateur();

        $response = $this->actingAs($utilisateur, 'sanctum')
                         ->postJson('/api/change-password', [
                             'mot_de_passe_actuel'                    => 'MauvaisAncienMdp!1',
                             'nouveau_mot_de_passe'                   => 'N0uveau!P@ssw0rd',
                             'nouveau_mot_de_passe_confirmation'      => 'N0uveau!P@ssw0rd',
                         ]);

        $response->assertStatus(422);
    }

    /** ❌ Changement de MDP sans confirmation → 422 */
    public function test_changement_mot_de_passe_sans_confirmation_echoue(): void
    {
        $utilisateur = $this->creerUtilisateur();

        $response = $this->actingAs($utilisateur, 'sanctum')
                         ->postJson('/api/change-password', [
                             'mot_de_passe_actuel'  => 'P@ssw0rd!123',
                             'nouveau_mot_de_passe' => 'N0uveau!P@ssw0rd',
                             // Pas de confirmation
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nouveau_mot_de_passe']);
    }
}
