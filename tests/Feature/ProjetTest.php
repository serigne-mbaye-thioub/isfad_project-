<?php

namespace Tests\Feature;

use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_creation_projet_et_assignation_automatique_chef_de_projet(): void
    {
        $user = Utilisateur::create([
            'nom' => 'Test',
            'prenom' => 'User',
            'email' => 'test@isfad.sn',
            'mot_de_passe' => bcrypt('password'),
            'fonction' => 'Chef de projet',
            'actif' => true
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/projets', [
            'titre' => 'Nouveau Projet Gouvernance',
            'date_debut' => now()->toDateString(),
            'date_fin' => now()->addMonths(6)->toDateString(),
            'priorite' => 'haute'
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('projets', [
            'titre' => 'Nouveau Projet Gouvernance',
            'id_createur' => $user->id
        ]);

        $this->assertDatabaseHas('participation_projets', [
            'id_utilisateur' => $user->id,
            'role_projet' => 'chef_projet',
        ]);
    }

    public function test_admin_peut_voir_tous_les_projets(): void
    {
        $admin = Utilisateur::create([
            'nom' => 'Admin', 'prenom' => 'Sys', 'email' => 'admin@isfad.sn',
            'mot_de_passe' => bcrypt('password'), 'fonction' => 'Administrateur', 'actif' => true
        ]);
        
        $otherUser = Utilisateur::create([
            'nom' => 'Other', 'prenom' => 'User', 'email' => 'other@isfad.sn',
            'mot_de_passe' => bcrypt('password'), 'fonction' => 'Membre', 'actif' => true
        ]);
        
        Projet::create([
            'titre' => 'Projet de test', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'avancement' => 0, 'id_createur' => $otherUser->id
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/projets');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
    }
}
