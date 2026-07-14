<?php
try {
    $req = \Illuminate\Http\Request::create('/api/projets/2', 'GET');
    $req->setUserResolver(function() { return \App\Models\Utilisateur::find(1); }); // Admin
    $res = app()->handle($req);
    $data = json_decode($res->getContent(), true);
    
    if (isset($data['phases'])) {
        echo "PHASES: " . count($data['phases']) . "\n";
        foreach ($data['phases'] as $p) {
            echo "- " . $p['titre'] . "\n";
        }
    } else {
        echo "NO PHASES KEY IN JSON\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
