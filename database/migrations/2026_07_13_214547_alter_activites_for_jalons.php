<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rendre id_phase nullable
        Schema::table('activites', function (Blueprint $table) {
            $table->dropForeign(['id_phase']);
        });

        Schema::table('activites', function (Blueprint $table) {
            $table->unsignedBigInteger('id_phase')->nullable()->change();
            $table->foreign('id_phase')->references('id')->on('phases')->cascadeOnDelete()->cascadeOnUpdate();
            
            $table->foreignId('id_projet')
                  ->nullable()
                  ->after('id')
                  ->constrained('projets')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();

            $table->foreignId('id_jalon')
                  ->nullable()
                  ->after('id_phase')
                  ->constrained('jalons')
                  ->nullOnDelete()
                  ->cascadeOnUpdate();
        });

        // 2. Mettre a jour les anciennes activites avec leur id_projet respectif
        DB::statement('UPDATE activites SET id_projet = phases.id_projet FROM phases WHERE activites.id_phase = phases.id AND activites.id_phase IS NOT NULL');
    }

    public function down(): void
    {
        Schema::table('activites', function (Blueprint $table) {
            $table->dropForeign(['id_projet']);
            $table->dropColumn('id_projet');
            
            $table->dropForeign(['id_jalon']);
            $table->dropColumn('id_jalon');
        });
    }
};
