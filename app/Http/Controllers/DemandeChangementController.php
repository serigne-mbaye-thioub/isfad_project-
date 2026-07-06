<?php

namespace App\Http\Controllers;

use App\Models\DemandeChangement;
use App\Models\Projet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandeChangementController extends Controller
{
    /**
     * Helper pour vérifier l'appartenance au projet.
     */
    private function checkAccess($user, $idProjet, $requireAdminOrChef = false): bool
    {
        $isGlobalAdmin = $user->isAdminGlobally() || ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        if ($isGlobalAdmin) return true;

        $participation = \App\Models\ParticipationProjet::where('id_projet', $idProjet)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        if (!$participation) return false;

        if ($requireAdminOrChef) {
            return in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']);
        }

        return true; // Simple membre
    }

    /**
     * Lister les demandes de changement d'un projet.
     */
    public function index(Request $request, int $idProjet): JsonResponse
    {
        if (!$this->checkAccess($request->user(), $idProjet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $projet = Projet::findOrFail($idProjet);
        
        $demandes = DemandeChangement::where('id_projet', $idProjet)
            ->with(['demandeur', 'approbateur'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($demandes);
    }

    /**
     * Créer une nouvelle demande de changement.
     */
    public function store(Request $request, int $idProjet): JsonResponse
    {
        if (!$this->checkAccess($request->user(), $idProjet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'impact_delai_jours' => 'nullable|integer',
            'impact_budget' => 'nullable|numeric',
            'priorite' => 'nullable|in:basse,moyenne,haute,critique',
        ]);

        $projet = Projet::findOrFail($idProjet);

        $demande = new DemandeChangement($validated);
        $demande->id_projet = $projet->id;
        $demande->id_demandeur = $request->user()->id;
        $demande->statut = 'soumise';
        $demande->priorite = $validated['priorite'] ?? 'moyenne';
        
        $demande->save();

        return response()->json([
            'message' => 'Demande de changement soumise avec succès.',
            'demande' => $demande->load('demandeur')
        ], 201);
    }

    /**
     * Mettre à jour le statut (Approuver, Rejeter, etc.).
     */
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $demande = DemandeChangement::findOrFail($id);

        if (!$this->checkAccess($request->user(), $demande->id_projet, true)) {
            return response()->json(['message' => 'Accès non autorisé. Seul le Chef de projet, Gestionnaire, ou l\'Administrateur peut statuer sur cette demande.'], 403);
        }

        $validated = $request->validate([
            'statut' => 'required|in:en_analyse,approuvee,rejetee,appliquee',
            'commentaire_decision' => 'nullable|string',
        ]);
        
        $demande->statut = $validated['statut'];
        
        if (in_array($validated['statut'], ['approuvee', 'rejetee'])) {
            $demande->id_approbateur = $request->user()->id;
            $demande->date_decision = now();
        }

        if (isset($validated['commentaire_decision'])) {
            $demande->commentaire_decision = $validated['commentaire_decision'];
        }

        $demande->save();

        return response()->json([
            'message' => 'Statut de la demande mis à jour.',
            'demande' => $demande->load(['demandeur', 'approbateur'])
        ]);
    }
}
