<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demande_changements', function (Blueprint $table) {
            $table->id();
            $table->enum('type_cible', ['projet', 'phase', 'activite', 'tache', 'reunion'])
                ->comment('Type de l entite concernee par la demande');
            $table->unsignedBigInteger('id_cible')->comment('Identifiant de l entite cible, reference polymorphe');
            $table->string('titre', 200);
            $table->text('description');
            $table->text('justification');
            $table->enum('statut', ['en_attente', 'acceptee', 'refusee', 'annulee'])->default('en_attente');
            $table->enum('niveau_approbation', ['gestionnaire', 'chef_projet', 'superviseur'])->default('gestionnaire');
            $table->foreignId('id_demandeur')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->timestamp('date_traitement')->nullable();
            $table->timestamps();

            $table->index(['type_cible', 'id_cible']);
            $table->index('statut');
            $table->index('niveau_approbation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demande_changements');
    }
};