<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    /**
     * GET /api/admin/configurations
     * Retourne toutes les configurations globales.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->fonction, ['Administrateur', 'Administrateur système'])) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(Configuration::all());
    }

    /**
     * PUT /api/admin/configurations/{cle}
     * Met à jour une configuration spécifique.
     */
    public function update(Request $request, $cle): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->fonction, ['Administrateur', 'Administrateur système'])) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $config = Configuration::where('cle', $cle)->firstOrFail();

        $validated = $request->validate([
            'valeur' => 'required|string',
        ]);

        // Validation additionnelle selon le type
        if ($config->type === 'boolean' && !in_array($validated['valeur'], ['0', '1', 'true', 'false'])) {
            return response()->json(['message' => 'La valeur doit être un booléen (0 ou 1).'], 422);
        }
        if ($config->type === 'integer' && !is_numeric($validated['valeur'])) {
            return response()->json(['message' => 'La valeur doit être un entier.'], 422);
        }

        // Normalisation boolean
        if ($config->type === 'boolean') {
            $validated['valeur'] = ($validated['valeur'] === 'true' || $validated['valeur'] === '1') ? '1' : '0';
        }

        $config->update(['valeur' => $validated['valeur']]);

        return response()->json([
            'message' => 'Configuration mise à jour avec succès.',
            'configuration' => $config
        ]);
    }
}
