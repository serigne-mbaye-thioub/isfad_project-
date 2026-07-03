<?php

namespace Tests\Feature;

use App\Models\ParticipationProjet;
use App\Models\Projet;
use App\Models\Tache;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EquipeTest extends TestCase
{
    use RefreshDatabase;

    private function makeProjet(Utilisateur $chef): Projet
    {
        $projet = Projet::create([
            'titre' => 'Projet Test Équipe', 'description' => 'Test',
            'date_debut' => '2026-01-01', 'date_fin' => '2026-12-31',
            'statut' => 'en_cours', 'id_createur' => $chef->id,
            'etat_spse' => 'non_transmis', 'avancement' => 0,
        ]);

        ParticipationProjet::create([
            'id_projet' => $projet->id, 'id_utilisateur' => $chef->id,
            'role_projet' => 'chef_projet', 'statut' => 'actif',
            'date_affectation' => now(),
        ]);

        return $projet;
    }

    private function makeUser(?string $email = null): Utilisateur
    {
        static $i = 0;
        $i++;
        return Utilisateur::create([
            'nom' => 'User', 'prenom' => "Test$i",
            'email' => $email ?? "user{$i}@test.sn",
            'mot_de_passe' => 'Password@1', 'fonction' => 'Membre d\'équipe',
            'actif' => true, 'premiere_connexion' => false,
        ]);
    }

    // ── Test 1 : Lister les membres ──────────────────────────────────────────
    public function test_chef_peut_lister_equipe()
    {
        $chef = $this->makeUser('chef@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        $response = $this->getJson("/api/projets/{$projet->id}/equipe");

        $response->assertStatus(200)
                 ->assertJsonStructure(['projet_id', 'titre', 'membres', 'total'])
                 ->assertJsonPath('total', 1);
    }

    // ── Test 2 : Ajouter un membre ───────────────────────────────────────────
    public function test_chef_peut_ajouter_membre()
    {
        $chef = $this->makeUser('chef2@test.sn');
        $membre = $this->makeUser('membre@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        $response = $this->postJson("/api/projets/{$projet->id}/equipe", [
            'id_utilisateur' => $membre->id,
            'role_projet' => 'membre',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('participation_projets', [
            'id_projet' => $projet->id,
            'id_utilisateur' => $membre->id,
            'role_projet' => 'membre',
            'statut' => 'actif',
        ]);
    }

    // ── Test 3 : Membre sans droit ne peut pas ajouter ───────────────────────
    public function test_simple_membre_ne_peut_pas_ajouter()
    {
        $chef = $this->makeUser('chef3@test.sn');
        $simple = $this->makeUser('simple@test.sn');
        $projet = $this->makeProjet($chef);

        // Ajouter le simple comme membre ordinaire
        ParticipationProjet::create([
            'id_projet' => $projet->id, 'id_utilisateur' => $simple->id,
            'role_projet' => 'membre', 'statut' => 'actif', 'date_affectation' => now(),
        ]);

        Sanctum::actingAs($simple);

        $autre = $this->makeUser('autre@test.sn');
        $response = $this->postJson("/api/projets/{$projet->id}/equipe", [
            'id_utilisateur' => $autre->id, 'role_projet' => 'membre',
        ]);

        $response->assertStatus(403);
    }

    // ── Test 4 : Retirer un membre ───────────────────────────────────────────
    public function test_chef_peut_retirer_membre()
    {
        $chef = $this->makeUser('chef4@test.sn');
        $membre = $this->makeUser('membre2@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        $participation = ParticipationProjet::create([
            'id_projet' => $projet->id, 'id_utilisateur' => $membre->id,
            'role_projet' => 'membre', 'statut' => 'actif', 'date_affectation' => now(),
        ]);

        $response = $this->deleteJson("/api/projets/{$projet->id}/equipe/{$participation->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('participation_projets', [
            'id' => $participation->id, 'statut' => 'retire',
        ]);
    }

    // ── Test 5 : Impossible de retirer le dernier chef ───────────────────────
    public function test_impossible_retirer_seul_chef()
    {
        $chef = $this->makeUser('chef5@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        $participation = ParticipationProjet::where('id_projet', $projet->id)
            ->where('id_utilisateur', $chef->id)->first();

        $response = $this->deleteJson("/api/projets/{$projet->id}/equipe/{$participation->id}");

        $response->assertStatus(422)
                 ->assertJsonPath('message', fn($msg) => str_contains($msg, 'seul Chef'));
    }

    // ── Test 6 : Réaffectation responsable tâche ─────────────────────────────
    public function test_reaffectation_responsable_tache_verifie_membership()
    {
        $chef = $this->makeUser('chef6@test.sn');
        $nonMembre = $this->makeUser('nonmembre@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        $tache = Tache::create([
            'id_projet' => $projet->id, 'titre' => 'Tâche test',
            'date_debut' => '2026-01-01', 'date_limite' => '2026-06-30',
            'statut' => 'a_faire', 'id_responsable' => $chef->id,
        ]);

        // Tenter d'affecter à quelqu'un qui n'est pas membre → doit échouer
        $response = $this->patchJson("/api/taches/{$tache->id}/responsable", [
            'id_responsable' => $nonMembre->id,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('message', fn($msg) => str_contains($msg, 'membre actif'));
    }

    // ── Test 7 : Utilisateurs disponibles ────────────────────────────────────
    public function test_liste_utilisateurs_disponibles()
    {
        $chef = $this->makeUser('chef7@test.sn');
        Sanctum::actingAs($chef);
        $projet = $this->makeProjet($chef);

        // Créer un user qui n'est pas membre
        $dispo = $this->makeUser('dispo@test.sn');

        $response = $this->getJson("/api/utilisateurs/disponibles?projet_id={$projet->id}");

        $response->assertStatus(200);
        // Le chef ne doit pas apparaître (déjà membre), mais dispo oui
        $ids = collect($response->json())->pluck('id')->toArray();
        $this->assertContains($dispo->id, $ids);
        $this->assertNotContains($chef->id, $ids);
    }
}
