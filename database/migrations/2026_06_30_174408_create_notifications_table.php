<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type_evenement', 100);
            $table->string('titre', 200);
            $table->text('contenu');
            $table->string('type_cible', 30)->nullable()->comment('Reference polymorphe : projet, tache, reunion, demande_changement');
            $table->unsignedBigInteger('id_cible')->nullable();
            $table->foreignId('id_emetteur')
                ->nullable()
                ->constrained('utilisateurs')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->comment('NULL si notification generee par le systeme');
            $table->timestamps();

            $table->index(['type_cible', 'id_cible']);
            $table->index('type_evenement');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};