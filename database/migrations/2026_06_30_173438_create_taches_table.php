<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_activite')
                ->constrained('activites')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->enum('priorite', ['basse', 'moyenne', 'haute', 'critique'])->default('moyenne');
            $table->date('date_debut');
            $table->date('date_limite');
            $table->enum('statut', ['a_faire', 'en_cours', 'en_revision', 'terminee', 'archivee'])->default('a_faire');
            $table->integer('retard_jours')->nullable()->comment('Calcule : date_limite vs date de cloture reelle');
            $table->date('date_cloture')->nullable();

            $table->foreignId('id_responsable')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate()
                ->comment('Responsable RACI unique de la tache');

            $table->foreignId('id_approbateur')
                ->nullable()
                ->constrained('utilisateurs')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->comment('Approbateur RACI unique de la tache, optionnel');

            $table->softDeletes()->comment('Archivage logique de la tache');
            $table->timestamps();

            $table->index('id_activite');
            $table->index('statut');
            $table->index('date_limite');
            $table->index('id_responsable');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};