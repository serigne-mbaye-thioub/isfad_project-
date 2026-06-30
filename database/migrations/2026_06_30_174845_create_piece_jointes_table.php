<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('piece_jointes', function (Blueprint $table) {
            $table->id();
            $table->enum('type_cible', ['projet', 'tache', 'reunion', 'demande_changement']);
            $table->unsignedBigInteger('id_cible')->comment('Reference polymorphe');
            $table->string('nom_fichier', 300);
            $table->string('nom_stockage', 500)->comment('Nom unique en stockage : UUID plus extension');
            $table->string('type_mime', 100);
            $table->unsignedBigInteger('taille_octets');
            $table->string('url_acces', 500);
            $table->foreignId('id_deposant')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->timestamps();

            $table->index(['type_cible', 'id_cible']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('piece_jointes');
    }
};