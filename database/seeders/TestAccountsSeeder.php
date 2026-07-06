<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Administrateur'         => 'admin',
            'Superviseur'            => 'superviseur',
            'Chef de projet'         => 'chef',
            'Gestionnaire de projet' => 'gestionnaire',
            'Membre d’équipe'        => 'membre',
            'Partenaire'             => 'partenaire',
            'Architecte de projet'   => 'architecte',
        ];

        foreach ($roles as $fonction => $prefix) {
            $email = "{$prefix}@isfad.sn";
            
            // On s'assure de ne pas recréer s'il existe déjà
            if (!Utilisateur::where('email', $email)->exists()) {
                Utilisateur::create([
                    'nom'                => strtoupper($prefix),
                    'prenom'             => 'Test',
                    'email'              => $email,
                    'telephone'          => '770000000',
                    'fonction'           => $fonction,
                    'mot_de_passe'       => 'passer123', // Utilisateur.php a un cast "hashed"
                    'actif'              => true,
                    'premiere_connexion' => false, // Pour éviter de devoir changer le mot de passe lors des tests
                ]);
            }
        }
    }
}
