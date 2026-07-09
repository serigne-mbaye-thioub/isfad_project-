<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TacheCommentaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_tache',
        'id_auteur',
        'contenu',
    ];

    public function tache()
    {
        return $this->belongsTo(Tache::class, 'id_tache');
    }

    public function auteur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_auteur');
    }
}
