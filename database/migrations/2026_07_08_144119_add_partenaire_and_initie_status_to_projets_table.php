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
            $table->string('partenaire')->nullable()->after('division');
        });

        // Modification de la contrainte CHECK pour PostgreSQL
        DB::statement('ALTER TABLE projets DROP CONSTRAINT IF EXISTS projets_statut_check');
        DB::statement("ALTER TABLE projets ADD CONSTRAINT projets_statut_check CHECK (statut::text = ANY (ARRAY['initie'::character varying, 'transmis_chef'::character varying, 'a_demarrer'::character varying, 'en_cours'::character varying, 'suspendu'::character varying, 'cloture'::character varying, 'annule'::character varying, 'archive'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir à l'ancienne contrainte
        DB::statement('ALTER TABLE projets DROP CONSTRAINT IF EXISTS projets_statut_check');
        DB::statement("ALTER TABLE projets ADD CONSTRAINT projets_statut_check CHECK (statut::text = ANY (ARRAY['a_demarrer'::character varying, 'en_cours'::character varying, 'suspendu'::character varying, 'cloture'::character varying, 'annule'::character varying, 'archive'::character varying]::text[]))");

        Schema::table('projets', function (Blueprint $table) {
            $table->dropColumn('partenaire');
        });
    }
};
