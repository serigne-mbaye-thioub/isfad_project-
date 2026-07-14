<?php
$user = \App\Models\Utilisateur::find(7);
auth()->login($user);
$controller = app(\App\Http\Controllers\ProjetController::class);
$request = \Illuminate\Http\Request::create('/api/projets/21', 'GET');
$request->setUserResolver(function() use ($user) { return $user; });
$res = $controller->show($request, 21);
file_put_contents('dump3.json', $res->getContent());
echo "Done";
