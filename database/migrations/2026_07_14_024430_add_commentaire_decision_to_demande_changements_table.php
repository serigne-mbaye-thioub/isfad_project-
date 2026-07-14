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
        Schema::table('demande_changements', function (Blueprint $table) {
            $table->text('commentaire_decision')->nullable()->after('justification');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demande_changements', function (Blueprint $table) {
            $table->dropColumn('commentaire_decision');
        });
    }
};
