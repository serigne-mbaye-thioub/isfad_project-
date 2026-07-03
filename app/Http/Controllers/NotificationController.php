<?php

namespace App\Http\Controllers;

use App\Models\NotificationDestinataire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Liste les notifications de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = NotificationDestinataire::with('notification.emetteur')
            ->where('id_utilisateur', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(50) // Limiter aux 50 dernières
            ->get();

        return response()->json($notifications);
    }

    /**
     * Marquer une notification comme lue
     */
    public function marquerLue(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $destinataire = NotificationDestinataire::where('id_utilisateur', $user->id)
            ->findOrFail($id);

        $destinataire->marquerCommeLue();

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function marquerToutesLues(Request $request): JsonResponse
    {
        $user = $request->user();

        NotificationDestinataire::where('id_utilisateur', $user->id)
            ->where('est_lue', false)
            ->update([
                'est_lue' => true,
                'date_lecture' => now(),
            ]);

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }
}
