<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_phase')
                ->constrained('phases')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['a_faire', 'en_cours', 'bloquee', 'terminee', 'annulee'])->default('a_faire');
            $table->enum('priorite', ['basse', 'moyenne', 'haute', 'critique'])->default('moyenne');
            $table->decimal('avancement', 5, 2)->default(0);
            $table->foreignId('id_responsable')
                ->nullable()
                ->constrained('utilisateurs')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->timestamps();

            $table->index('id_phase');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activites');
    }
};