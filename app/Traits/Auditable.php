<?php

namespace App\Traits;

use App\Models\JournalAudit;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::logAudit('CREATED', $model);
        });

        static::updated(function ($model) {
            self::logAudit('UPDATED', $model);
        });

        static::deleted(function ($model) {
            self::logAudit('DELETED', $model);
        });
    }

    protected static function logAudit($action, $model)
    {
        $anciennes = $action === 'UPDATED' || $action === 'DELETED' ? $model->getOriginal() : null;
        $nouvelles = $action === 'CREATED' || $action === 'UPDATED' ? $model->getAttributes() : null;

        // On ignore les modifications qui ne concernent que la date de mise à jour (évite de spammer les logs)
        if ($action === 'UPDATED' && is_array($anciennes) && is_array($nouvelles)) {
            $changed = array_diff_assoc($nouvelles, $anciennes);
            unset($changed['updated_at']);
            if (empty($changed)) {
                return;
            }
        }

        // On ne loggue pas les tokens ou mots de passe en clair
        if (isset($anciennes['mot_de_passe'])) $anciennes['mot_de_passe'] = '[MASQUÉ]';
        if (isset($nouvelles['mot_de_passe'])) $nouvelles['mot_de_passe'] = '[MASQUÉ]';

        JournalAudit::create([
            'id_utilisateur' => Auth::id(),
            'action' => $action,
            'type_element' => class_basename($model),
            'id_element' => $model->id,
            'anciennes_valeurs' => $anciennes ? json_encode($anciennes) : null,
            'nouvelles_valeurs' => $nouvelles ? json_encode($nouvelles) : null,
            'ip_adresse' => request()->ip(),
        ]);
    }
}
