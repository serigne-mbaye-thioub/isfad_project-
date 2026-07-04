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
        Schema::table('projets', function (Blueprint $table) {
            $table->text('fiche_projet')->nullable()->after('description');
            $table->string('fiche_fichier')->nullable()->after('fiche_projet');
            $table->boolean('transmis_gestionnaire')->default(false)->after('etat_spse');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projets', function (Blueprint $table) {
            $table->dropColumn(['fiche_projet', 'fiche_fichier', 'transmis_gestionnaire']);
        });
    }
};
