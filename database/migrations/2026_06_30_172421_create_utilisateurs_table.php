<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('mot_de_passe', 255)->comment('Mot de passe hache bcrypt');
            $table->string('fonction', 100)->nullable();
            $table->boolean('actif')->default(true)->comment('Compte actif des sa creation par l administrateur');
            $table->boolean('premiere_connexion')->default(true)->comment('Force le changement du mot de passe par defaut');
            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();

            $table->index('email');
            $table->index('actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};