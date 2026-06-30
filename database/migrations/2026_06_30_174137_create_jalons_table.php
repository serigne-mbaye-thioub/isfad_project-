<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jalons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_projet')
                ->constrained('projets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('id_phase')
                ->nullable()
                ->constrained('phases')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->comment('Optionnel : rattachement a une phase specifique');
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->date('echeance');
            $table->enum('statut', ['en_attente', 'atteint', 'manque'])->default('en_attente');
            $table->timestamps();

            $table->index('id_projet');
            $table->index('echeance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jalons');
    }
};