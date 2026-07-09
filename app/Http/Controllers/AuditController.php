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
        $audits = JournalAudit::with('utilisateur')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($audits);
    }
}
