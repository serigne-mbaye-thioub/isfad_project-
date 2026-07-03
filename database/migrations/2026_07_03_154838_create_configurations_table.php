<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configurations', function (Blueprint $table) {
            $table->id();
            $table->string('cle')->unique();
            $table->string('valeur')->nullable();
            $table->enum('type', ['boolean', 'integer', 'string'])->default('string');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Insertion des configurations par défaut proposées
        DB::table('configurations')->insert([
            [
                'cle' => 'maintenance_mode',
                'valeur' => '0',
                'type' => 'boolean',
                'description' => 'Si activé, seuls les administrateurs peuvent se connecter.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cle' => 'delai_relance_tache_jours',
                'valeur' => '2',
                'type' => 'integer',
                'description' => 'Nombre de jours de retard avant relance automatique.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cle' => 'max_upload_size_mb',
                'valeur' => '10',
                'type' => 'integer',
                'description' => 'Taille maximale des fichiers joints en Mégaoctets.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('configurations');
    }
};
