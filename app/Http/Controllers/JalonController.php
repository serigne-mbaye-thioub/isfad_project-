<?php

namespace App\Http\Controllers;

use App\Models\Jalon;
use App\Models\Projet;
use Illuminate\Http\Request;

class JalonController extends Controller
{
    private function peutGererJalon($user, $id_projet)
    {
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if ($user->isAdminGlobally()) {
            return true;
        }
        
        $projet = Projet::find($id_projet);
        if ($isGlobalManager && $projet && $projet->transmis_gestionnaire) {
            return true;
        }

        $participation = \App\Models\ParticipationProjet::where('id_projet', $id_projet)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        return $participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']);
    }

    public function store(Request $request, $id_projet)
    {
        $projet = Projet::findOrFail($id_projet);
        
        if (!$this->peutGererJalon($request->user(), $projet->id)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'echeance' => 'required|date',
            'id_phase' => 'nullable|exists:phases,id',
        ]);

        $jalon = Jalon::create(array_merge($validated, [
            'id_projet' => $projet->id,
            'statut' => 'en_attente',
        ]));

        return response()->json($jalon, 201);
    }

    public function update(Request $request, $id)
    {
        $jalon = Jalon::findOrFail($id);
        
        if (!$this->peutGererJalon($request->user(), $jalon->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'titre' => 'string|max:200',
            'description' => 'nullable|string',
            'echeance' => 'date',
            'id_phase' => 'nullable|exists:phases,id',
            'statut' => 'in:en_attente,atteint,manque',
        ]);

        $jalon->update($validated);

        return response()->json($jalon);
    }

    public function destroy(Request $request, $id)
    {
        $jalon = Jalon::findOrFail($id);
        
        if (!$this->peutGererJalon($request->user(), $jalon->id_projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }
        
        $jalon->delete();

        return response()->json(['message' => 'Jalon supprimé avec succès'], 200);
    }
}
