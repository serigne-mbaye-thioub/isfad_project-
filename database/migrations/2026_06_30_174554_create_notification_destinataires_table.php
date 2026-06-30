<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_destinataires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_notification')
                ->constrained('notifications')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('id_utilisateur')
                ->constrained('utilisateurs')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->boolean('est_lue')->default(false);
            $table->timestamp('date_lecture')->nullable();
            $table->timestamps();

            $table->unique(['id_notification', 'id_utilisateur'], 'notification_destinataire_unique');
            $table->index('est_lue');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_destinataires');
    }
};