<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Simuler un utilisateur admin
    $user = \App\Models\Utilisateur::where('fonction', 'Administrateur')->first();
    if (!$user) {
        $user = \App\Models\Utilisateur::first();
        echo "Utilisateur de test: " . $user->fonction . "\n";
    }

    $request = \Illuminate\Http\Request::create('/api/admin/dashboard/stats', 'GET');
    $request->setUserResolver(function() use ($user) {
        return $user;
    });

    $controller = new \App\Http\Controllers\AdminDashboardController();
    $response = $controller->stats($request);

    echo "Status: " . $response->getStatusCode() . "\n";
    echo $response->getContent();
} catch (\Throwable $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
