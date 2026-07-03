<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile()
    {
        $user = Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => 'test@example.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Membre d’équipe', 'actif' => true
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/me', [
            'nom' => 'Nouveau',
            'prenom' => 'Profil',
            'telephone' => '770000000'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('utilisateurs', [
            'id' => $user->id,
            'nom' => 'Nouveau',
            'prenom' => 'Profil',
            'telephone' => '770000000'
        ]);
    }

    public function test_admin_can_deactivate_user()
    {
        $admin = Utilisateur::create([
            'nom' => 'Admin', 'prenom' => 'Admin', 'email' => 'admin@test.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Administrateur', 'actif' => true
        ]);

        $user = Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => 'test@test.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Membre d’équipe', 'actif' => true
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/admin/users/{$user->id}/statut", [
            'actif' => false
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('utilisateurs', [
            'id' => $user->id,
            'actif' => false
        ]);
    }
}
