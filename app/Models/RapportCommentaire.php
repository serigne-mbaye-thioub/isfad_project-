<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RapportCommentaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'rapport_id',
        'id_auteur',
        'contenu',
    ];

    public function rapport()
    {
        return $this->belongsTo(Rapport::class, 'rapport_id');
    }

    public function auteur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_auteur');
    }
}
