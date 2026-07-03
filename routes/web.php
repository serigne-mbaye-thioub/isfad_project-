<?php

use Illuminate\Support\Facades\Route;

// Catch-all pour le SPA React : toutes les routes web renvoient la vue welcome.
// React Router prend ensuite en charge le routage côté client.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
