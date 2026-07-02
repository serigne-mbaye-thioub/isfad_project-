<?php

namespace Tests\Feature;

use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PhaseActiviteTest extends TestCase
{
    use RefreshDatabase;

    private function createUser($fonction = 'Chef de projet') {
        return Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => fake()->unique()->safeEmail(),
            'mot_de_passe' => bcrypt('password'), 'fonction' => $fonction, 'actif' => true
        ]);
    }

    public function test_creation_phase_et_activite()
    {
        $chef = $this->createUser();
        Sanctum::actingAs($chef);

        $projet = Projet::create([
            'titre' => 'Projet A', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'id_createur' => $chef->id
        ]);

        // 1. Création Phase
        $responsePhase = $this->postJson("/api/projets/{$projet->id}/phases", [
            'nom' => 'initialisation',
            'date_debut' => now()->toDateString(),
            'date_fin' => now()->addDays(5)->toDateString()
        ]);
        $responsePhase->assertStatus(201);
        $phaseId = $responsePhase->json('id');

        // 2. Création Activité dans cette phase
        $responseActivite = $this->postJson("/api/phases/{$phaseId}/activites", [
            'titre' => 'Activité de démarrage',
            'date_debut' => now()->toDateString(),
            'date_fin' => now()->addDays(2)->toDateString()
        ]);
        $responseActivite->assertStatus(201);

        $this->assertDatabaseHas('phases', ['nom' => 'initialisation', 'id_projet' => $projet->id]);
        $this->assertDatabaseHas('activites', ['titre' => 'Activité de démarrage', 'id_phase' => $phaseId]);
    }

    public function test_changement_statut_spse()
    {
        $admin = $this->createUser('Administrateur');
        Sanctum::actingAs($admin);

        $projet = Projet::create([
            'titre' => 'Projet A', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'id_createur' => $admin->id
        ]);

        $response = $this->patchJson("/api/projets/{$projet->id}/etat-spse", [
            'etat_spse' => 'transmis_spse'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'etat_spse' => 'transmis_spse'
        ]);
    }
}
