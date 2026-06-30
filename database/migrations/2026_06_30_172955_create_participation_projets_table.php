<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participation_projets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_utilisateur')
                ->constrained('utilisateurs')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('id_projet')
                ->constrained('projets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('role_projet', [
                'superviseur',
                'gestionnaire_projet',
                'chef_projet',
                'architecte_projet',
                'membre_equipe',
                'partenaire',
            ])->comment('Role contextuel, propre a ce projet, attribue par le chef de projet');
            $table->date('date_affectation')->useCurrent();
            $table->enum('statut', ['actif', 'suspendu', 'sorti'])->default('actif');
            $table->timestamps();

            $table->unique(['id_utilisateur', 'id_projet'], 'participation_unique_utilisateur_projet');
            $table->index('role_projet');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participation_projets');
    }
};