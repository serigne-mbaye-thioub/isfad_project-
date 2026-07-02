<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reunions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_projet')
                ->nullable()
                ->constrained('projets')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->comment('NULL si reunion totalement independante d un projet');
            $table->string('titre', 200);
            $table->text('ordre_du_jour');
            $table->string('lieu', 300)->nullable();
            $table->dateTime('date_reunion');
            $table->unsignedInteger('duree_minutes')->nullable();
            $table->text('compte_rendu')->nullable();
            $table->enum('statut', ['en_attente', 'planifiee', 'en_cours', 'terminee', 'annulee'])->default('en_attente');
            $table->foreignId('id_organisateur')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->timestamps();

            $table->index('date_reunion');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reunions');
    }
};