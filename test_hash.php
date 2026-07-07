<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\Utilisateur::where('email', 'chef@isfad.sn')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}
echo 'passer123: ' . (Hash::check('passer123', $user->mot_de_passe) ? 'OUI' : 'NON') . "\n";
echo 'password: ' . (Hash::check('password', $user->mot_de_passe) ? 'OUI' : 'NON') . "\n";
