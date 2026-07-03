<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalAudit extends Model
{
    protected $table = 'journal_audits';

    protected $fillable = [
        'id_utilisateur',
        'action',
        'type_element',
        'id_element',
        'anciennes_valeurs',
        'nouvelles_valeurs',
        'ip_adresse',
    ];

    protected function casts(): array
    {
        return [
            'anciennes_valeurs' => 'array',
            'nouvelles_valeurs' => 'array',
        ];
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
