<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    protected $table = 'configurations';

    protected $fillable = [
        'cle',
        'valeur',
        'type',
        'description',
    ];

    /**
     * Helper statique pour récupérer rapidement une configuration formatée.
     */
    public static function getValeur($cle, $default = null)
    {
        $config = self::where('cle', $cle)->first();
        if (!$config) {
            return $default;
        }

        return match ($config->type) {
            'boolean' => (bool) $config->valeur,
            'integer' => (int) $config->valeur,
            default => $config->valeur,
        };
    }
}
