<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\Utilisateur::where('email', 'admin@isfad.sn')->first();
if (!$user) {
    echo "ERREUR: Utilisateur introuvable en base !\n";
    exit;
}
echo "=== DIAGNOSTIC COMPTE ADMIN ===\n";
echo "ID       : " . $user->id . "\n";
echo "Email    : " . $user->email . "\n";
echo "Actif    : " . ($user->actif ? 'OUI' : 'NON - PROBLEME ICI') . "\n";
echo "Fonction : " . $user->fonction . "\n";
echo "1ere cnx : " . ($user->premiere_connexion ? 'OUI' : 'non') . "\n";
echo "Hash MDP : " . substr($user->mot_de_passe, 0, 30) . "...\n";
echo "Hash OK? : " . (Illuminate\Support\Facades\Hash::check('Admin123!', $user->mot_de_passe) ? 'OUI - mot de passe correct' : 'NON - mot de passe INCORRECT') . "\n";
