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

        return response()->json([
            'message' => 'Commentaire ajouté avec succès.',
            'commentaire' => $commentaire->load('auteur:id,nom,prenom,fonction')
        ], 201);
    }
}
