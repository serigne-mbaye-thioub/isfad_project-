<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_projet')
                ->constrained('projets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('nom', [
                'initialisation',
                'planification',
                'execution',
                'suivi',
                'cloture',
            ]);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['en_attente', 'en_cours', 'terminee', 'annulee'])->default('en_attente');
            $table->unsignedSmallInteger('ordre')->default(1);
            $table->decimal('avancement', 5, 2)->default(0);
            $table->timestamps();

            $table->index(['id_projet', 'ordre']);
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phases');
    }
};