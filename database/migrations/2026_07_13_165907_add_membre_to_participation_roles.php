<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            Schema::table('participation_projets', function (Blueprint $table) {
                $table->string('role_projet_new')->nullable();
            });

            \Illuminate\Support\Facades\DB::statement("
                UPDATE participation_projets SET role_projet_new = role_projet
            ");

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->dropColumn('role_projet');
            });

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->enum('role_projet', [
                    'partenaire',
                    'architecte',
                    'chef_projet',
                    'superviseur',
                    'gestionnaire',
                    'admin',
                    'membre'
                ])->default('membre')->after('id_projet');
            });

            \Illuminate\Support\Facades\DB::statement("
                UPDATE participation_projets
                SET role_projet = role_projet_new
            ");

            Schema::table('participation_projets', function (Blueprint $table) {
                $table->dropColumn('role_projet_new');
            });

        } else {
            Schema::drop('participation_projets');
            Schema::create('participation_projets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('id_utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
                $table->foreignId('id_projet')->constrained('projets')->cascadeOnDelete()->cascadeOnUpdate();
                $table->enum('role_projet', ['partenaire', 'architecte', 'chef_projet', 'superviseur', 'gestionnaire', 'admin', 'membre'])->default('membre');
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
        Schema::table('participation_roles', function (Blueprint $table) {
            //
        });
    }
};
