<?php

namespace Tests\Feature;

use App\Mail\CredentialsMailable;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Crée un administrateur en BDD.
     */
    private function creerAdmin(): Utilisateur
    {
        return Utilisateur::create([
            'nom'                => 'Admin',
            'prenom'             => 'Sys',
            'email'              => 'admin@isfad.sn',
            'mot_de_passe'       => Hash::make('password123'),
            'fonction'           => 'Administrateur',
            'actif'              => true,
            'premiere_connexion' => false,
        ]);
    }

    /**
     * Crée un utilisateur standard en BDD.
     */
    private function creerSimpleUtilisateur(): Utilisateur
    {
        return Utilisateur::create([
            'nom'                => 'Sow',
            'prenom'             => 'Fatou',
            'email'              => 'fatou@isfad.sn',
            'mot_de_passe'       => Hash::make('password123'),
            'fonction'           => 'Membre d’équipe',
            'actif'              => true,
            'premiere_connexion' => false,
        ]);
    }

    /** ❌ Un non-administrateur ne peut pas appeler la création d'utilisateur */
    public function test_non_admin_ne_peut_pas_creer_utilisateur(): void
    {
        $user = $this->creerSimpleUtilisateur();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/admin/users', [
                             'nom'      => 'Diallo',
                             'prenom'   => 'Moussa',
                             'email'    => 'moussa@isfad.sn',
                             'fonction' => 'Chef de projet',
                         ]);

        $response->assertStatus(403);
    }

    /** ✅ L'administrateur peut créer un utilisateur avec succès */
    public function test_admin_peut_creer_utilisateur_valide(): void
    {
        Mail::fake();

        $admin = $this->creerAdmin();

        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/admin/users', [
                             'nom'       => 'Diallo',
                             'prenom'    => 'Moussa',
                             'email'     => 'moussa@isfad.sn',
                             'telephone' => '771234567',
                             'fonction'  => 'Chef de projet',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'utilisateur' => [
                         'id', 'nom', 'prenom', 'email', 'telephone', 'fonction', 'actif', 'premiere_connexion', 'created_at'
                     ]
                 ]);

        // Vérification en BDD
        $this->assertDatabaseHas('utilisateurs', [
            'email'              => 'moussa@isfad.sn',
            'fonction'           => 'Chef de projet',
            'actif'              => true,
            'premiere_connexion' => true,
        ]);

        // Vérification de l'envoi d'e-mail
        Mail::assertSent(CredentialsMailable::class, function ($mail) {
            return $mail->hasTo('moussa@isfad.sn') && !empty($mail->motDePasseTemporaire);
        });
    }

    /** ❌ La création échoue si la fonction (le rôle) est invalide */
    public function test_creation_echoue_si_fonction_invalide(): void
    {
        $admin = $this->creerAdmin();

        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/admin/users', [
                             'nom'      => 'Diallo',
                             'prenom'   => 'Moussa',
                             'email'    => 'moussa@isfad.sn',
                             'fonction' => 'RoleInexistant',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['fonction']);
    }

    /** ❌ La création échoue si l'email existe déjà */
    public function test_creation_echoue_si_email_deja_pris(): void
    {
        $admin = $this->creerAdmin();
        $this->creerSimpleUtilisateur(); // email: fatou@isfad.sn

        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/admin/users', [
                             'nom'      => 'Diallo',
                             'prenom'   => 'Moussa',
                             'email'    => 'fatou@isfad.sn',
                             'fonction' => 'Chef de projet',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /** ✅ Flux d'activation complet : Première connexion -> Obligation de changer de mot de passe */
    public function test_flux_activation_complet_premiere_connexion(): void
    {
        Mail::fake();

        $admin = $this->creerAdmin();

        // 1. Création du compte par l'admin
        $this->actingAs($admin, 'sanctum')
             ->postJson('/api/admin/users', [
                 'nom'      => 'Diop',
                 'prenom'   => 'Ibrahima',
                 'email'    => 'ibrahima@isfad.sn',
                 'fonction' => 'Membre d’équipe',
             ]);

        // On récupère le mot de passe généré depuis l'e-mail envoyé
        $motDePasseTemp = null;
        Mail::assertSent(CredentialsMailable::class, function ($mail) use (&$motDePasseTemp) {
            $motDePasseTemp = $mail->motDePasseTemporaire;
            return true;
        });

        $this->assertNotNull($motDePasseTemp);

        // 2. L'utilisateur se connecte avec le mot de passe temporaire
        $responseConnexion = $this->postJson('/api/login', [
            'email'        => 'ibrahima@isfad.sn',
            'mot_de_passe' => $motDePasseTemp,
        ]);

        $responseConnexion->assertStatus(200)
                          ->assertJsonPath('premiere_connexion', true);

        $token = $responseConnexion->json('access_token');

        $nouvelUtilisateur = Utilisateur::where('email', 'ibrahima@isfad.sn')->first();

        // 3. Changement du mot de passe obligatoire en agissant en tant que nouvel utilisateur
        $responseChangement = $this->actingAs($nouvelUtilisateur, 'sanctum')
                                    ->postJson('/api/change-password', [
                                        'mot_de_passe_actuel'                 => $motDePasseTemp,
                                        'nouveau_mot_de_passe'                => 'NouveauP@ssw0rd123!',
                                        'nouveau_mot_de_passe_confirmation'   => 'NouveauP@ssw0rd123!',
                                    ]);

        $responseChangement->assertStatus(200);

        // Le flag premiere_connexion doit être désactivé
        $this->assertDatabaseHas('utilisateurs', [
            'email'              => 'ibrahima@isfad.sn',
            'premiere_connexion' => false,
        ]);
    }
}
