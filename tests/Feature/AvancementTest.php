<?php

namespace Tests\Feature;

use App\Models\Projet;
use App\Models\Phase;
use App\Models\Activite;
use App\Models\Tache;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AvancementTest extends TestCase
{
    use RefreshDatabase;

    public function test_calcul_avancement_cascade()
    {
        $admin = Utilisateur::create([
            'nom' => 'A', 'prenom' => 'B', 'email' => 'a@b.c',
            'mot_de_passe' => bcrypt('123'), 'fonction' => 'Administrateur', 'actif' => true
        ]);
        Sanctum::actingAs($admin);

        $projet = Projet::create([
            'titre' => 'P1', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'id_createur' => $admin->id, 'avancement' => 0
        ]);

        $phase = Phase::create([
            'id_projet' => $projet->id, 'nom' => 'initialisation', 'date_debut' => now(), 'date_fin' => now(), 
            'statut' => 'en_attente', 'avancement' => 0
        ]);

        $activite = Activite::create([
            'id_phase' => $phase->id, 'titre' => 'Act1', 'date_debut' => now(), 'date_fin' => now(), 
            'statut' => 'a_faire', 'avancement' => 0
        ]);

        // Création de 2 tâches dans cette activité
        $tache1 = Tache::create([
            'id_activite' => $activite->id, 'titre' => 'T1', 'date_debut' => now(), 'date_limite' => now(), 'statut' => 'a_faire', 'id_responsable' => $admin->id
        ]);

        $tache2 = Tache::create([
            'id_activite' => $activite->id, 'titre' => 'T2', 'date_debut' => now(), 'date_limite' => now(), 'statut' => 'a_faire', 'id_responsable' => $admin->id
        ]);

        // 1. Validation de la Tâche 1 -> Avancement 50% attendu
        $response1 = $this->patchJson("/api/taches/{$tache1->id}/statut", ['statut' => 'terminee']);
        $response1->assertStatus(200);

        $this->assertEquals(50, Activite::find($activite->id)->avancement);
        $this->assertEquals(50, Phase::find($phase->id)->avancement);
        $this->assertEquals(50, Projet::find($projet->id)->avancement);

        // 2. Validation de la Tâche 2 -> Avancement 100% attendu
        $response2 = $this->patchJson("/api/taches/{$tache2->id}/statut", ['statut' => 'terminee']);
        $response2->assertStatus(200);

        $this->assertEquals(100, Activite::find($activite->id)->avancement);
        $this->assertEquals(100, Phase::find($phase->id)->avancement);
        $this->assertEquals(100, Projet::find($projet->id)->avancement);
    }
}
