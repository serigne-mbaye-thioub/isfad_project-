<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\Utilisateur::where('email', 'membre@isfad.sn')->first();
if (!$user) {
    echo "Membre non trouvé.\n";
    exit;
}

$projets = App\Models\Projet::whereHas('participations', function($q) use ($user) {
    $q->where('id_utilisateur', $user->id);
})->orWhere('id_createur', $user->id)->get();

echo "Projets pour membre (" . $user->id . "): " . count($projets) . PHP_EOL;

// Verifions les participations
$parts = App\Models\ParticipationProjet::where('id_utilisateur', $user->id)->get();
echo "Participations : " . count($parts) . PHP_EOL;
foreach ($parts as $p) {
    echo " - Projet ID: {$p->id_projet}, Role: {$p->role_projet}, Statut: {$p->statut}\n";
}

