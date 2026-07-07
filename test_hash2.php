<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\Utilisateur::create([
    'nom' => 'Test2', 
    'prenom' => 'Test2', 
    'email' => 'test2@test.com', 
    'telephone' => '123', 
    'mot_de_passe' => 'passer123', 
    'fonction' => 'Administrateur', 
    'actif' => true, 
    'premiere_connexion' => false
]);
echo "Created User Hash: " . $u->mot_de_passe . "\n";
echo 'Hash Check for Test2: ' . (Hash::check('passer123', $u->mot_de_passe) ? 'OUI' : 'NON') . "\n";

$chef = App\Models\Utilisateur::where('email', 'chef@isfad.sn')->first();
echo "Chef Hash: " . $chef->mot_de_passe . "\n";
$admin = App\Models\Utilisateur::where('email', 'admin@isfad.sn')->first();
echo "Admin Hash: " . $admin->mot_de_passe . "\n";

// Let's manually set a known hash for chef
$chef->mot_de_passe = 'passer123'; // This should trigger the cast
$chef->save();
echo "Chef Hash after save: " . $chef->fresh()->mot_de_passe . "\n";
echo "Chef Hash Check after save: " . (Hash::check('passer123', $chef->fresh()->mot_de_passe) ? 'OUI' : 'NON') . "\n";
