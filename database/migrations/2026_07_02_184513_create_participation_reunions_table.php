<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participation_reunions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_reunion')
                ->constrained('reunions')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('id_utilisateur')
                ->constrained('utilisateurs')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->enum('statut_presence', ['en_attente', 'accepte', 'decline'])->default('en_attente');
            $table->timestamps();

            $table->unique(['id_reunion', 'id_utilisateur'], 'participation_reunion_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participation_reunions');
    }
};
