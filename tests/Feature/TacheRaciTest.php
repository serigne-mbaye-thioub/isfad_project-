<?php

namespace Tests\Feature;

use App\Models\Projet;
use App\Models\Tache;
use App\Models\TacheRaci;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TacheRaciTest extends TestCase
{
    use RefreshDatabase;

    private function createUser($email, $fonction = 'Membre') {
        return Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => $email,
            'mot_de_passe' => bcrypt('password'), 'fonction' => $fonction, 'actif' => true
        ]);
    }

    public function test_creation_tache_directement_liee_au_projet(): void
    {
        $user = $this->createUser('user@isfad.sn', 'Chef de projet');
        $responsable = $this->createUser('resp@isfad.sn');
        
        $projet = Projet::create([
            'titre' => 'Projet de test', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'avancement' => 0, 'id_createur' => $user->id
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/taches', [
            'id_projet' => $projet->id,
            'titre' => 'Tâche de développement',
            'date_debut' => now()->toDateString(),
            'date_limite' => now()->addDays(5)->toDateString(),
            'id_responsable' => $responsable->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('taches', [
            'id_projet' => $projet->id,
            'titre' => 'Tâche de développement',
            'id_responsable' => $responsable->id
        ]);
    }

    public function test_utilisateur_consulte_peut_modifier_statut(): void
    {
        $createur = $this->createUser('createur@isfad.sn');
        $responsable = $this->createUser('resp@isfad.sn');
        $consulte = $this->createUser('consulte@isfad.sn');
        
        $projet = Projet::create([
            'titre' => 'Projet de test', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'avancement' => 0, 'id_createur' => $createur->id
        ]);
        
        $tache = Tache::create([
            'id_projet' => $projet->id, 'titre' => 'Tache 1', 'date_debut' => now(),
            'date_limite' => now()->addDays(5), 'id_responsable' => $responsable->id, 'statut' => 'a_faire'
        ]);

        TacheRaci::create([
            'id_tache' => $tache->id,
            'id_utilisateur' => $consulte->id,
            'role_raci' => 'consulte'
        ]);

        Sanctum::actingAs($consulte);

        $response = $this->patchJson("/api/taches/{$tache->id}/statut", [
            'statut' => 'en_cours'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('taches', ['id' => $tache->id, 'statut' => 'en_cours']);
    }

    public function test_utilisateur_non_autorise_ne_peut_pas_modifier_statut(): void
    {
        $createur = $this->createUser('createur@isfad.sn');
        $responsable = $this->createUser('resp@isfad.sn');
        $lambda = $this->createUser('lambda@isfad.sn');
        
        $projet = Projet::create([
            'titre' => 'Projet de test', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'avancement' => 0, 'id_createur' => $createur->id
        ]);
        
        $tache = Tache::create([
            'id_projet' => $projet->id, 'titre' => 'Tache 1', 'date_debut' => now(),
            'date_limite' => now()->addDays(5), 'id_responsable' => $responsable->id, 'statut' => 'a_faire'
        ]);

        Sanctum::actingAs($lambda);

        $response = $this->patchJson("/api/taches/{$tache->id}/statut", [
            'statut' => 'en_cours'
        ]);

        $response->assertStatus(403);
    }
}
