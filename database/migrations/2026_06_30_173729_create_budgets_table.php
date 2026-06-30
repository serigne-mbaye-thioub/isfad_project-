<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_projet')
                ->unique()
                ->constrained('projets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate()
                ->comment('Un budget unique par projet');
            $table->decimal('montant_initial', 15, 2);
            $table->decimal('montant_consomme', 15, 2)->default(0);
            $table->decimal('montant_disponible', 15, 2);
            $table->char('devise', 3)->default('XOF');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};