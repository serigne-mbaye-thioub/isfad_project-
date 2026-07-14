<?php
try {
    $req = \Illuminate\Http\Request::create('/api/projets/2/rapports', 'GET');
    $req->setUserResolver(function() { return \App\Models\Utilisateur::find(3); }); // Fatou Diallo
    $res = app()->handle($req);
    echo "STATUS: " . $res->getStatusCode() . "\n";
    if ($res->getStatusCode() != 200) {
        echo "ERROR:\n" . $res->getContent() . "\n";
    } else {
        echo "SUCCESS\n";
    }
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
}
