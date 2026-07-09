<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tache_commentaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_tache')->constrained('taches')->onDelete('cascade');
            $table->foreignId('id_auteur')->constrained('utilisateurs')->onDelete('cascade');
            $table->text('contenu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tache_commentaires');
    }
};
