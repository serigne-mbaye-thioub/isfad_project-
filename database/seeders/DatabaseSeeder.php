<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Utilisateur::create([
            'nom'               => 'Admin',
            'prenom'            => 'ISFAD',
            'email'             => 'admin@isfad.sn',
            'mot_de_passe'      => Hash::make('password'),
            'fonction'          => 'Administrateur système',
            'actif'             => true,
            'premiere_connexion' => true,
        ]);
    }
}
