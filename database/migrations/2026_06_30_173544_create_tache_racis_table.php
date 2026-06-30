<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tache_racis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_tache')
                ->constrained('taches')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('id_utilisateur')
                ->constrained('utilisateurs')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('role_raci', ['consulte', 'informe'])
                ->comment('Responsable et Approbateur sont geres directement sur la table taches');
            $table->timestamps();

            $table->unique(['id_tache', 'id_utilisateur', 'role_raci'], 'tache_raci_unique');
            $table->index('role_raci');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tache_racis');
    }
};