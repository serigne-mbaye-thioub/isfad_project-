<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UtilisateurController extends Controller
{
    /**
     * Liste de tous les utilisateurs actifs (pour les selects/dropdowns).
     */
    public function index(Request $request): JsonResponse
    {
        $utilisateurs = Utilisateur::where('actif', true)
            ->select('id', 'nom', 'prenom', 'fonction', 'email')
            ->orderBy('nom', 'asc')
            ->get();

        return response()->json($utilisateurs);
    }
}
