<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Utilisateur;
use App\Models\Projet;
use App\Models\Phase;
use App\Models\Activite;
use App\Models\Tache;
use App\Models\Reunion;
use App\Models\DemandeChangement;
use App\Models\ParticipationProjet;
use App\Models\Notification;
use Carbon\Carbon;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Désactiver les contraintes de clés étrangères pour vider les tables
        DB::statement('SET session_replication_role = \'replica\';'); // Pour PostgreSQL (ou MySQL: SET FOREIGN_KEY_CHECKS=0;)
        
        try {
            DB::statement('TRUNCATE TABLE notifications CASCADE');
            DB::statement('TRUNCATE TABLE demande_changements CASCADE');
            DB::statement('TRUNCATE TABLE reunions CASCADE');
            DB::statement('TRUNCATE TABLE taches CASCADE');
            DB::statement('TRUNCATE TABLE activites CASCADE');
            DB::statement('TRUNCATE TABLE phases CASCADE');
            DB::statement('TRUNCATE TABLE participation_projets CASCADE');
            DB::statement('TRUNCATE TABLE projets CASCADE');
        } catch (\Exception $e) {
            // Fallback pour MySQL / SQLite au cas où
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('notifications')->truncate();
            DB::table('demande_changements')->truncate();
            DB::table('reunions')->truncate();
            DB::table('taches')->truncate();
            DB::table('activites')->truncate();
            DB::table('phases')->truncate();
            DB::table('participation_projets')->truncate();
            DB::table('projets')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
        
        DB::statement('SET session_replication_role = \'origin\';');

        // 2. Récupérer des utilisateurs existants
        $users = Utilisateur::all();
        if ($users->count() === 0) {
            $this->command->error("Aucun utilisateur trouvé. Veuillez d'abord créer des utilisateurs.");
            return;
        }

        // On prend le premier utilisateur comme Admin/Chef de projet principal (sûrement l'utilisateur actuel)
        $mainUser = $users->first();
        // On prend d'autres utilisateurs au hasard pour les assignations
        $otherUsers = $users->where('id', '!=', $mainUser->id)->values();

        $now = Carbon::now();

        // ==========================================
        // PROJET 1 : Refonte du Système Informatique
        // ==========================================
        $projet1 = Projet::create([
            'id_createur' => $mainUser->id,
            'titre' => 'Refonte du Système d\'Information Global',
            'description' => 'Modernisation complète de l\'infrastructure IT de l\'organisation. Migration vers le cloud et mise en place de nouveaux outils collaboratifs.',
            'date_debut' => $now->copy()->subDays(30),
            'date_fin' => $now->copy()->addDays(90),
            'statut' => 'en_cours',
            'transmis_gestionnaire' => true
        ]);

        ParticipationProjet::create(['id_projet' => $projet1->id, 'id_utilisateur' => $mainUser->id, 'role_projet' => 'chef_projet', 'statut' => 'actif']);
        if (isset($otherUsers[0])) ParticipationProjet::create(['id_projet' => $projet1->id, 'id_utilisateur' => $otherUsers[0]->id, 'role_projet' => 'membre', 'statut' => 'actif']);

        $p1_phase1 = Phase::create(['id_projet' => $projet1->id, 'nom' => 'initialisation', 'date_debut' => $projet1->date_debut, 'date_fin' => $now->copy()->subDays(10), 'statut' => 'terminee', 'ordre' => 1]);
        $p1_phase2 = Phase::create(['id_projet' => $projet1->id, 'nom' => 'execution', 'date_debut' => $now->copy()->subDays(9), 'date_fin' => $now->copy()->addDays(40), 'statut' => 'en_cours', 'ordre' => 2]);
        $p1_phase3 = Phase::create(['id_projet' => $projet1->id, 'nom' => 'cloture', 'date_debut' => $now->copy()->addDays(41), 'date_fin' => $projet1->date_fin, 'statut' => 'en_attente', 'ordre' => 3]);

        // Activités P1
        $p1_act1 = Activite::create(['id_phase' => $p1_phase1->id, 'titre' => 'Audit de l\'existant', 'statut' => 'terminee', 'date_debut' => $p1_phase1->date_debut, 'date_fin' => $p1_phase1->date_fin->copy()->subDays(2)]);
        $p1_act2 = Activite::create(['id_phase' => $p1_phase2->id, 'titre' => 'Migration des bases de données', 'statut' => 'en_cours', 'date_debut' => $p1_phase2->date_debut, 'date_fin' => $now->copy()->addDays(15)]);
        
        // Tâches P1
        Tache::create(['id_projet' => $projet1->id, 'id_activite' => $p1_act1->id, 'id_responsable' => $mainUser->id, 'titre' => 'Cartographie des serveurs', 'priorite' => 'haute', 'statut' => 'terminee', 'date_debut' => $p1_act1->date_debut, 'date_limite' => $p1_act1->date_debut->copy()->addDays(5)]);
        Tache::create(['id_projet' => $projet1->id, 'id_activite' => $p1_act2->id, 'id_responsable' => isset($otherUsers[0]) ? $otherUsers[0]->id : $mainUser->id, 'titre' => 'Export des données clients', 'priorite' => 'critique', 'statut' => 'en_cours', 'date_debut' => $now->copy()->subDays(2), 'date_limite' => $now->copy()->addDays(5)]);
        // Tâche en retard : date_limite est dans le passé, le statut reste en_cours
        Tache::create(['id_projet' => $projet1->id, 'id_activite' => $p1_act2->id, 'id_responsable' => $mainUser->id, 'titre' => 'Configuration du cluster Cloud', 'priorite' => 'haute', 'statut' => 'en_cours', 'date_debut' => $now->copy()->subDays(8), 'date_limite' => $now->copy()->subDays(1), 'retard_jours' => 1]);

        // ==========================================
        // PROJET 2 : Lancement Plateforme E-learning ISFAD
        // ==========================================
        $projet2 = Projet::create([
            'id_createur' => $mainUser->id,
            'titre' => 'Lancement Plateforme E-learning',
            'description' => 'Développement et déploiement d\'une nouvelle plateforme numérique pour la formation à distance (ISFAD).',
            'date_debut' => $now->copy()->subDays(15),
            'date_fin' => $now->copy()->addDays(120),
            'statut' => 'en_cours',
            'transmis_gestionnaire' => true
        ]);

        ParticipationProjet::create(['id_projet' => $projet2->id, 'id_utilisateur' => $mainUser->id, 'role_projet' => 'gestionnaire', 'statut' => 'actif']);
        if (isset($otherUsers[1])) ParticipationProjet::create(['id_projet' => $projet2->id, 'id_utilisateur' => $otherUsers[1]->id, 'role_projet' => 'chef_projet', 'statut' => 'actif']);

        $p2_phase1 = Phase::create(['id_projet' => $projet2->id, 'nom' => 'planification', 'date_debut' => $projet2->date_debut, 'date_fin' => $now->copy()->addDays(5), 'statut' => 'en_cours', 'ordre' => 1]);
        $p2_act1 = Activite::create(['id_phase' => $p2_phase1->id, 'titre' => 'Design des maquettes', 'statut' => 'en_cours', 'date_debut' => $p2_phase1->date_debut, 'date_fin' => $now->copy()->addDays(2)]);
        Tache::create(['id_projet' => $projet2->id, 'id_activite' => $p2_act1->id, 'id_responsable' => $mainUser->id, 'titre' => 'Design de la page d\'accueil', 'priorite' => 'moyenne', 'statut' => 'en_cours', 'date_debut' => $now->copy()->subDays(5), 'date_limite' => $now->copy()->addDays(1)]);
        Tache::create(['id_projet' => $projet2->id, 'id_activite' => $p2_act1->id, 'id_responsable' => $mainUser->id, 'titre' => 'Design du tableau de bord étudiant', 'priorite' => 'haute', 'statut' => 'a_faire', 'date_debut' => $now->copy()->addDays(2), 'date_limite' => $now->copy()->addDays(5)]);

        // ==========================================
        // PROJET 3 : Projet à risque (En retard)
        // ==========================================
        $projet3 = Projet::create([
            'id_createur' => $mainUser->id,
            'titre' => 'Campagne Marketing Digitale',
            'description' => 'Campagne de recrutement de nouveaux étudiants pour la rentrée.',
            'date_debut' => $now->copy()->subDays(60),
            'date_fin' => $now->copy()->subDays(5),
            // Le statut en_retard n'existe pas pour un projet, on utilise en_cours
            'statut' => 'en_cours',
            'transmis_gestionnaire' => true
        ]);
        ParticipationProjet::create(['id_projet' => $projet3->id, 'id_utilisateur' => $mainUser->id, 'role_projet' => 'chef_projet', 'statut' => 'actif']);
        $p3_phase = Phase::create(['id_projet' => $projet3->id, 'nom' => 'execution', 'date_debut' => $now->copy()->subDays(30), 'date_fin' => $now->copy()->subDays(5), 'statut' => 'en_cours', 'ordre' => 1]);
        $p3_act = Activite::create(['id_phase' => $p3_phase->id, 'titre' => 'Ads Réseaux Sociaux', 'statut' => 'en_cours', 'date_debut' => $now->copy()->subDays(20), 'date_fin' => $now->copy()->subDays(5)]);
        Tache::create(['id_projet' => $projet3->id, 'id_activite' => $p3_act->id, 'id_responsable' => $mainUser->id, 'titre' => 'Clôturer la campagne Facebook', 'priorite' => 'critique', 'statut' => 'en_cours', 'date_debut' => $now->copy()->subDays(10), 'date_limite' => $now->copy()->subDays(5), 'retard_jours' => 5]);

        // ==========================================
        // REUNIONS
        // ==========================================
        Reunion::create([
            'id_projet' => $projet1->id,
            'id_organisateur' => $mainUser->id,
            'titre' => 'Point d\'étape : Refonte SI',
            'ordre_du_jour' => 'Revue de la migration des bases de données.',
            'lieu' => 'Salle de conférence A (ou Visio)',
            'date_reunion' => $now->copy()->addHours(2),
            'duree_minutes' => 60,
            'statut' => 'planifiee'
        ]);
        Reunion::create([
            'id_projet' => $projet2->id,
            'id_organisateur' => $mainUser->id,
            'titre' => 'Validation des maquettes UI',
            'ordre_du_jour' => 'Présentation au client des designs finaux.',
            'lieu' => 'Google Meet',
            'date_reunion' => $now->copy()->addDays(2)->setHour(14)->setMinute(0),
            'duree_minutes' => 45,
            'statut' => 'planifiee'
        ]);
        Reunion::create([
            'id_projet' => $projet1->id,
            'id_organisateur' => $mainUser->id,
            'titre' => 'Lancement du projet (Kick-off)',
            'ordre_du_jour' => 'Présentation des équipes et des objectifs.',
            'lieu' => 'Amphithéâtre',
            'date_reunion' => $projet1->date_debut->copy()->addDays(1),
            'duree_minutes' => 120,
            'statut' => 'terminee'
        ]);

        // ==========================================
        // DEMANDES DE CHANGEMENT
        // ==========================================
        DemandeChangement::create([
            'type_cible' => 'projet',
            'id_cible' => $projet2->id,
            'titre' => 'Augmentation du budget design',
            'description' => 'Nous avons besoin de 500 000 FCFA supplémentaires pour acquérir des licences logicielles et une banque d\'images.',
            'justification' => 'Nécessaire pour garantir une qualité premium du rendu visuel.',
            'statut' => 'en_attente',
            'niveau_approbation' => 'gestionnaire',
            'id_demandeur' => isset($otherUsers[0]) ? $otherUsers[0]->id : $mainUser->id,
            'created_at' => $now->copy()->subHours(5)
        ]);

        DemandeChangement::create([
            'type_cible' => 'projet',
            'id_cible' => $projet3->id,
            'titre' => 'Extension de la date de fin',
            'description' => 'Décaler la fin de la campagne de 15 jours suite aux retards de production des vidéos.',
            'justification' => 'Les prestataires ont eu du retard.',
            'statut' => 'acceptee',
            'niveau_approbation' => 'chef_projet',
            'id_demandeur' => $mainUser->id,
            'date_traitement' => $now->copy()->subDays(1),
            'created_at' => $now->copy()->subDays(3)
        ]);

        echo "Simulation de donnees terminee avec succes !\n";
    }
}
