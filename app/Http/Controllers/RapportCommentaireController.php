<?php

namespace App\Http\Controllers;

use App\Models\Rapport;
use App\Models\RapportCommentaire;
use App\Models\Notification;
use Illuminate\Http\Request;

class RapportCommentaireController extends Controller
{
    public function index($rapportId)
    {
        $commentaires = RapportCommentaire::with('auteur:id,nom,prenom,fonction')
            ->where('rapport_id', $rapportId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($commentaires);
    }

    public function store(Request $request, $rapportId)
    {
        $validated = $request->validate([
            'contenu' => 'required|string',
        ]);

        $user = $request->user();
        $rapport = Rapport::with('destinataires')->findOrFail($rapportId);

        $commentaire = RapportCommentaire::create([
            'rapport_id' => $rapportId,
            'id_auteur' => $user->id,
            'contenu' => $validated['contenu'],
        ]);

        // Notifications
        $destinatairesNotifier = [];

        // Si l'auteur du commentaire n'est pas l'auteur du rapport, on notifie l'auteur du rapport
        if ($rapport->id_auteur !== $user->id) {
            $destinatairesNotifier[] = $rapport->id_auteur;
        }

        // On notifie aussi les destinataires du rapport qui ne sont pas l'auteur du commentaire
        foreach ($rapport->destinataires as $dest) {
            if ($dest->id !== $user->id) {
                $destinatairesNotifier[] = $dest->id;
            }
        }

        // Eviter les doublons
        $destinatairesNotifier = array_unique($destinatairesNotifier);

        foreach ($destinatairesNotifier as $destId) {
            $notif = Notification::create([
                'type_evenement' => 'nouveau_commentaire_rapport',
                'titre'          => 'Nouveau commentaire sur un rapport',
                'contenu'        => $user->prenom . " " . $user->nom . " a commenté le rapport : \"" . $rapport->titre . "\".",
                'type_cible'     => 'rapport',
                'id_cible'       => $rapport->id,
                'id_emetteur'    => $user->id,
            ]);

            \App\Models\NotificationDestinataire::create([
                'id_notification' => $notif->id,
                'id_utilisateur'  => $destId,
                'est_lue'         => false,
            ]);
        }

        return response()->json($commentaire->load('auteur'), 201);
    }
}
