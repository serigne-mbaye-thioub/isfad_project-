<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration correctrice : uniformise les valeurs enum de participation_projets.
 *
 * Problème initial :
 * - role_projet : 'gestionnaire_projet', 'architecte_projet', 'membre_equipe'
 *   → Remplacé par : 'gestionnaire', 'architecte', 'membre' (cohérence avec le contrôleur)
 * - statut : 'sorti' → Remplacé par 'retire' (plus explicite)
 *
 * Note : Pour PostgreSQL, on ne peut pas modifier une colonne ENUM directement.
 * On supprime et recrée les colonnes avec les bonnes valeurs.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sur PostgreSQL, les ENUM sont des types personnalisés. On passe par un ALTER COLUMN.
        // Sur SQLite (tests), on recrée la table.
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL : convertir en varchar, mettre à jour les données, reconvertir
            Schema::table('participation_projets', function (Blueprint $table) {
                $table->string('role_projet_new')->nullable();
                $table->string('statut_new')->nullable();
            });

            \Illuminate\Support\Facades\DB::statement("
                UPDATE participation_projets SET role_projet_new = CASE role_projet
                    WHEN 'gestionnaire_projet' THEN 'gestionnaire'
                    WHEN 'architecte_projet'   THEN 'architecte'
                    WHEN 'membre_equipe'       THEN 'membre'
                    ELSE role_projet
                END
            ");
            \Illuminate\Support\Facades\DB::statement("
                UPDATE participation_projets SET statut_new = CASE statut
                    WHEN 'sorti' THEN 'retire'
                    ELSE statut
                END
            ");

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->dropColumn(['role_projet', 'statut']);
            });

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->enum('role_projet', [
                    'chef_projet',
                    'gestionnaire',
                    'architecte',
                    'superviseur',
                    'membre',
                    'partenaire',
                ])->default('membre')->after('id_projet');

                $table->enum('statut', ['actif', 'suspendu', 'retire'])->default('actif')->after('date_affectation');
            });

            \Illuminate\Support\Facades\DB::statement("
                UPDATE participation_projets
                SET role_projet = role_projet_new, statut = statut_new
            ");

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->dropColumn(['role_projet_new', 'statut_new']);
            });

        } else {
            // SQLite (tests) : on recrée simplement la table
            Schema::drop('participation_projets');
            Schema::create('participation_projets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('id_utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
                $table->foreignId('id_projet')->constrained('projets')->cascadeOnDelete()->cascadeOnUpdate();
                $table->enum('role_projet', ['chef_projet', 'gestionnaire', 'architecte', 'superviseur', 'membre', 'partenaire'])->default('membre');
                $table->date('date_affectation')->default(\Illuminate\Support\Facades\DB::raw('CURRENT_DATE'));
                $table->enum('statut', ['actif', 'suspendu', 'retire'])->default('actif');
                $table->timestamps();

                $table->unique(['id_utilisateur', 'id_projet'], 'participation_unique_utilisateur_projet');
                $table->index('role_projet');
            });
        }
    }

    public function down(): void
    {
        // Rollback non critique : les données de prod seraient à migrer manuellement
    }
};
