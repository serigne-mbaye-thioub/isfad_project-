<?php

namespace App\Http\Controllers;

use App\Mail\CredentialsMailable;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * POST /api/admin/users
     * Permet à l'Administrateur de créer un compte utilisateur.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Autorisation : vérification stricte du rôle Administrateur
        $currentUser = $request->user();
        if (!$currentUser || !Str::contains(strtolower($currentUser->fonction), 'administrateur')) {
            return response()->json([
                'message' => 'Accès non autorisé. Seul un administrateur peut effectuer cette action.',
            ], 403);
        }

        // 2. Validation des données d'entrée
        $validated = $request->validate([
            'nom'       => ['required', 'string', 'max:100'],
            'prenom'    => ['required', 'string', 'max:100'],
            'email'     => ['required', 'string', 'email:rfc', 'max:255', 'unique:utilisateurs,email'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'fonction'  => [
                'required',
                'string',
                Rule::in([
                    'Administrateur',
                    'Superviseur',
                    'Chef de projet',
                    'Gestionnaire de projet',
                    'Membre d’équipe',
                    'Partenaire',
                    'Architecte de projet',
                ]),
            ],
        ], [
            'email.unique' => 'Cette adresse email est déjà associée à un compte existant.',
            'fonction.in'  => 'La fonction sélectionnée n\'est pas un rôle valide du système.',
        ]);

        // 3. Génération d'un mot de passe temporaire fort (12 caractères)
        $motDePasseTemporaire = Str::random(12);

        // 4. Création de l'utilisateur
        $utilisateur = Utilisateur::create([
            'nom'                => $validated['nom'],
            'prenom'             => $validated['prenom'],
            'email'              => $validated['email'],
            'telephone'          => $validated['telephone'] ?? null,
            'fonction'           => $validated['fonction'],
            'mot_de_passe'       => $motDePasseTemporaire, // Hashé automatiquement par le cast
            'actif'              => true,
            'premiere_connexion' => true,
        ]);

        // 5. Envoi de l'e-mail contenant les identifiants
        Mail::to($utilisateur->email)->send(new CredentialsMailable($utilisateur, $motDePasseTemporaire));

        return response()->json([
            'message'     => 'Compte créé avec succès et e-mail envoyé.',
            'utilisateur' => [
                'id'                 => $utilisateur->id,
                'nom'                => $utilisateur->nom,
                'prenom'             => $utilisateur->prenom,
                'email'              => $utilisateur->email,
                'telephone'          => $utilisateur->telephone,
                'fonction'           => $utilisateur->fonction,
                'actif'              => $utilisateur->actif,
                'premiere_connexion' => $utilisateur->premiere_connexion,
                'created_at'         => $utilisateur->created_at?->toISOString(),
            ],
        ], 201);
    }
}
