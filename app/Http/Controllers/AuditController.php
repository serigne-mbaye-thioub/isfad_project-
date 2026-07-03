<?php

namespace App\Http\Controllers;

use App\Models\JournalAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * GET /api/admin/audits
     * Liste complète des logs d'audit.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !in_array($currentUser->fonction, ['Administrateur', 'Administrateur système'])) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $audits = JournalAudit::with('utilisateur')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($audits);
    }
}
