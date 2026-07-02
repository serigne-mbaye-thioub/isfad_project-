<?php

namespace Tests\Feature;

use App\Models\Projet;
use App\Models\Reunion;
use App\Models\Utilisateur;
use App\Models\ParticipationProjet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReunionTest extends TestCase
{
    use RefreshDatabase;

    private function createUser($fonction = 'Membre') {
        return Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => fake()->unique()->safeEmail(),
            'mot_de_passe' => bcrypt('password'), 'fonction' => $fonction, 'actif' => true
        ]);
    }

    public function test_simple_membre_cree_demande_reunion_en_attente(): void
    {
        Mail::fake();
        $membre = $this->createUser('Membre');
        Sanctum::actingAs($membre);

        $response = $this->postJson('/api/reunions', [
            'titre' => 'Demande de point technique',
            'ordre_du_jour' => 'Discussion sur l\'architecture',
            'date_reunion' => now()->addDays(2)->toDateTimeString(),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reunions', [
            'titre' => 'Demande de point technique',
            'statut' => 'en_attente'
        ]);
        
        Mail::assertNothingSent();
    }

    public function test_chef_projet_cree_reunion_planifiee_avec_notifications(): void
    {
        Mail::fake();
        $chef = $this->createUser('Chef de projet');
        $participant = $this->createUser('Membre');
        
        $projet = Projet::create([
            'titre' => 'Projet A', 'date_debut' => now(), 'date_fin' => now()->addDays(10),
            'statut' => 'a_demarrer', 'id_createur' => $chef->id
        ]);
        
        ParticipationProjet::create([
            'id_projet' => $projet->id, 'id_utilisateur' => $chef->id, 'role_projet' => 'chef_projet'
        ]);

        Sanctum::actingAs($chef);

        $response = $this->postJson('/api/reunions', [
            'id_projet' => $projet->id,
            'titre' => 'Réunion de lancement',
            'ordre_du_jour' => 'Kick-off',
            'date_reunion' => now()->addDays(2)->toDateTimeString(),
            'participants' => [$participant->id]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reunions', [
            'titre' => 'Réunion de lancement',
            'statut' => 'planifiee'
        ]);
        
        // Vérifie que la notification a été insérée
        $this->assertDatabaseHas('notifications', [
            'type_evenement' => 'reunion_planifiee',
            'type_cible' => 'reunion'
        ]);

        // Vérifie le Mailable (email mocké)
        Mail::assertSent(\App\Mail\ReunionPlanifieeMail::class, function ($mail) use ($participant) {
            return $mail->hasTo($participant->email);
        });
    }

    public function test_validation_demande_reunion(): void
    {
        Mail::fake();
        $admin = $this->createUser('Administrateur');
        $membre = $this->createUser('Membre');
        
        $reunion = Reunion::create([
            'titre' => 'Demande de validation',
            'ordre_du_jour' => 'test',
            'date_reunion' => now()->addDays(2),
            'statut' => 'en_attente',
            'id_organisateur' => $membre->id
        ]);

        // Ajout du participant
        $reunion->participants()->attach($membre->id, ['statut_presence' => 'en_attente']);

        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/reunions/{$reunion->id}/valider");

        $response->assertStatus(200);
        $this->assertDatabaseHas('reunions', [
            'id' => $reunion->id,
            'statut' => 'planifiee'
        ]);

        Mail::assertSent(\App\Mail\ReunionPlanifieeMail::class);
    }
}
