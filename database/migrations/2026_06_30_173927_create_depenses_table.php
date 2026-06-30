<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_budget')
                ->constrained('budgets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('libelle', 200);
            $table->decimal('montant', 15, 2);
            $table->string('categorie', 100);
            $table->date('date_depense');
            $table->enum('statut', ['en_attente', 'validee', 'rejetee'])->default('en_attente');
            $table->string('justificatif', 500)->nullable();
            $table->text('note')->nullable();
            $table->foreignId('id_createur')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->timestamps();

            $table->index('id_budget');
            $table->index('statut');
            $table->index('date_depense');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};