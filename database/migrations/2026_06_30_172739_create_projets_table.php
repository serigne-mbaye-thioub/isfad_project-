<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projets', function (Blueprint $table) {
            $table->id();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('priorite', ['basse', 'moyenne', 'haute', 'critique'])->default('moyenne');
            $table->enum('statut', [
                'a_demarrer',
                'en_cours',
                'suspendu',
                'cloture',
                'annule',
                'archive',
            ])->default('a_demarrer');
            $table->decimal('avancement', 5, 2)->default(0)->comment('Pourcentage de 0 a 100');
            $table->foreignId('id_createur')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->softDeletes();
            $table->timestamps();

            $table->index('statut');
            $table->index(['date_debut', 'date_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projets');
    }
};