<?php

namespace App\Http\Controllers;

use App\Models\DemandeChangement;
use App\Models\Projet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandeChangementController extends Controller
{
    /**
     * Lister les demandes de changement d'un projet.
     */
    public function index(int $idProjet): JsonResponse
    {
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
        $validated = $request->validate([
            'statut' => 'required|in:en_analyse,approuvee,rejetee,appliquee',
            'commentaire_decision' => 'nullable|string',
        ]);

        $demande = DemandeChangement::findOrFail($id);
        
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
