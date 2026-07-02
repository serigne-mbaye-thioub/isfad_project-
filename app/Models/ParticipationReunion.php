<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipationReunion extends Model
{
    use HasFactory;

    protected $table = 'participation_reunions';

    protected $fillable = [
        'id_reunion',
        'id_utilisateur',
        'statut_presence',
    ];

    public function reunion(): BelongsTo
    {
        return $this->belongsTo(Reunion::class, 'id_reunion');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
