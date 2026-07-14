<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\TacheCommentaire;
use Illuminate\Http\Request;

class TacheCommentaireController extends Controller
{
    /**
     * Vérifie si l'utilisateur a le droit d'accéder aux commentaires privés de la tâche.
     * Seuls le Responsable et l'Approbateur y ont accès.
     */
    private function canAccessCommentaires($user, $tache): bool
    {
        return $tache->id_responsable === $user->id || $tache->id_approbateur === $user->id;
    }

    /**
     * Récupérer les commentaires privés d'une tâche.
     */
    public function index(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);
        $user = $request->user();

        if (!$this->canAccessCommentaires($user, $tache)) {
            return response()->json([
                'message' => 'Accès non autorisé. Ces commentaires sont strictement privés entre l\'Approbateur et le Responsable de la tâche.'
            ], 403);
        }

        $commentaires = $tache->commentaires()->with('auteur:id,nom,prenom,fonction')->get();

        return response()->json($commentaires);
    }

    /**
     * Ajouter un commentaire privé à une tâche.
     */
    public function store(Request $request, $id)
    {
        $tache = Tache::findOrFail($id);
        $user = $request->user();

        if (!$this->canAccessCommentaires($user, $tache)) {
            return response()->json([
                'message' => 'Accès non autorisé. Ces commentaires sont strictement privés entre l\'Approbateur et le Responsable de la tâche.'
            ], 403);
        }

        $validated = $request->validate([
            'contenu' => 'required|string|max:2000'
        ]);

        $commentaire = TacheCommentaire::create([
            'id_tache' => $tache->id,
            'id_auteur' => $user->id,
            'contenu' => $validated['contenu']
        ]);

        // Déterminer le destinataire
        $destinataireId = null;
        if ($user->id === $tache->id_responsable && $tache->id_approbateur) {
            $destinataireId = $tache->id_approbateur;
        } elseif ($user->id === $tache->id_approbateur) {
            $destinataireId = $tache->id_responsable;
        }

        if ($destinataireId) {
            $idProjetLien = $tache->id_projet ?? $tache->activite?->id_projet ?? $tache->activite?->phase?->id_projet;
            
            $notif = \App\Models\Notification::create([
                'type_evenement' => 'message_tache',
                'titre' => "Nouveau message sur : {$tache->titre}",
                'contenu' => "{$user->prenom} {$user->nom} a dit :\n\"{$validated['contenu']}\"",
                'type_cible' => 'tache',
                'id_cible' => $tache->id,
                'id_emetteur' => $user->id,
            ]);

            \App\Models\NotificationDestinataire::create([
                'id_notification' => $notif->id,
                'id_utilisateur' => $destinataireId,
                'est_lue' => false,
            ]);
        }

        return response()->json([
            'message' => 'Commentaire ajouté avec succès.',
            'commentaire' => $commentaire->load('auteur:id,nom,prenom,fonction')
        ], 201);
    }
}
