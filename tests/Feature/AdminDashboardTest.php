<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use App\Models\Projet;
use App\Models\Configuration;
use App\Models\JournalAudit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_dashboard_stats()
    {
        $admin = Utilisateur::create([
            'nom' => 'Admin', 'prenom' => 'Super', 'email' => 'admin@test.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Administrateur', 'actif' => true
        ]);

        Sanctum::actingAs($admin);

        // Cet appel va déclencher automatiquement le Trait Auditable
        $projet = Projet::create([
            'titre' => 'Projet Test',
            'description' => 'Test',
            'budget_global' => 1000,
            'statut' => 'a_demarrer',
            'id_createur' => $admin->id,
            'etat_spse' => 'non_transmis',
            'date_debut' => '2026-07-01',
            'date_fin' => '2026-12-31'
        ]);

        $response = $this->getJson('/api/admin/dashboard/stats');
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'utilisateurs' => ['total', 'actifs', 'inactifs'],
            'projets' => ['par_statut', 'par_etat_spse'],
            'taches_en_retard',
            'activite_recente'
        ]);
        
        // Vérification de la traçabilité de l'action (Audit Trail)
        $this->assertDatabaseHas('journal_audits', [
            'action' => 'CREATED',
            'type_element' => 'Projet',
            'id_element' => $projet->id
        ]);
    }

    public function test_admin_can_update_configurations()
    {
        $admin = Utilisateur::create([
            'nom' => 'Admin', 'prenom' => 'Super', 'email' => 'admin@test.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Administrateur', 'actif' => true
        ]);
        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/admin/configurations/maintenance_mode', [
            'valeur' => '1'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('configurations', [
            'cle' => 'maintenance_mode',
            'valeur' => '1'
        ]);
    }
}
