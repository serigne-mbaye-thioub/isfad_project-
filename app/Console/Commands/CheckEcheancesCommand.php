<?php

namespace App\Console\Commands;

use App\Models\Tache;
use App\Models\Notification;
use App\Models\NotificationDestinataire;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckEcheancesCommand extends Command
{
    protected $signature = 'app:check-echeances';
    protected $description = 'Vérifier les échéances des tâches et notifier les responsables des retards';

    public function handle()
    {
        $this->info("Début de la vérification des échéances...");
        
        // Trouver toutes les tâches non terminées dont la date limite est dépassée
        $tachesEnRetard = Tache::whereIn('statut', ['a_faire', 'en_cours'])
            ->whereNotNull('date_limite')
            ->where('date_limite', '<', now()->startOfDay())
            ->get();

        $count = 0;

        foreach ($tachesEnRetard as $tache) {
            if ($tache->id_responsable) {
                // Vérifier si une notification n'a pas déjà été envoyée aujourd'hui pour éviter le spam
                $dejaNotifie = Notification::where('type_evenement', 'retard_tache')
                    ->where('id_cible', $tache->id)
                    ->whereDate('created_at', now()->toDateString())
                    ->exists();

                if (!$dejaNotifie) {
                    $notification = Notification::create([
                        'type_evenement' => 'retard_tache',
                        'titre' => 'Tâche en retard : ' . $tache->titre,
                        'contenu' => 'La date limite de votre tâche est dépassée depuis le ' . $tache->date_limite->format('d/m/Y') . '.',
                        'type_cible' => 'tache',
                        'id_cible' => $tache->id,
                    ]);

                    NotificationDestinataire::create([
                        'id_notification' => $notification->id,
                        'id_utilisateur' => $tache->id_responsable,
                        'est_lue' => false,
                    ]);
                    
                    // TODO: Mailable pour l'envoi d'email
                    
                    $count++;
                }
            }
        }

        $this->info("Vérification terminée. $count retards signalés.");
        Log::info("CRON CheckEcheances exécuté : $count notifications envoyées.");
    }
}
