<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('action', 50); // CREATED, UPDATED, DELETED, LOGIN
            $table->string('type_element')->nullable(); // Model class name (ex: Projet, Tache)
            $table->unsignedBigInteger('id_element')->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('ip_adresse', 45)->nullable();
            $table->timestamps();

            // Index pour la rapidité des requêtes du tableau de bord
            $table->index(['type_element', 'id_element']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_audits');
    }
};
