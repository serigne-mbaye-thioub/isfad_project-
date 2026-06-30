<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapports', function (Blueprint $table) {
            $table->id();
            $table->enum('type_cible', ['projet', 'tache', 'reunion']);
            $table->unsignedBigInteger('id_cible')->comment('Reference polymorphe vers projet, tache ou reunion');
            $table->string('titre', 200);
            $table->enum('type_rapport', ['avancement', 'budget', 'performance', 'cloture', 'synthese']);
            $table->text('contenu');
            $table->string('format_export', 10)->default('PDF');
            $table->string('url_export', 500)->nullable();
            $table->foreignId('id_auteur')
                ->constrained('utilisateurs')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->boolean('est_publie')->default(false);
            $table->timestamps();

            $table->index(['type_cible', 'id_cible']);
            $table->index('type_rapport');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapports');
    }
};