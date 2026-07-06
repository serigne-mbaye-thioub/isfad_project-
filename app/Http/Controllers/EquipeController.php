<?php

namespace App\Http\Controllers;

use App\Models\ParticipationProjet;
use App\Models\Projet;
use App\Models\Tache;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EquipeController — Gestion complète des équipes projet (Module 2).
 *
 * Responsabilités :
 * - Lister les membres d'un projet avec leurs rôles et statuts
 * - Ajouter un membre (en cours de projet ou à la création)
 * - Mettre à jour le rôle d'un membre existant
 * - Retirer un membre (désactivation logique, pas suppression)
 * - Réaffecter le responsable d'une tâche (avec vérification de membership)
 *
 * Règles métier :
 * - Seul le Chef de projet, le Gestionnaire ou l'Administrateur peut gérer l'équipe.
 * - On ne peut pas retirer le dernier Chef de projet d'un projet.
 * - Le responsable d'une tâche doit être membre actif du projet.
 */
class EquipeController extends Controller
{
    // ─── Rôles autorisés dans un projet ──────────────────────────────────────────
    const ROLES_PROJET = [
        'chef_projet',
        'gestionnaire',
        'membre',
        'partenaire',
        'superviseur',
        'architecte',
    ];

    // ─── Helpers privés ───────────────────────────────────────────────────────────

    private function peutGererEquipe(Utilisateur $user, Projet $projet): bool
    {
        // Les Admins et le rôle global Gestionnaire de projet (excluant Chef de projet/Architecte) ont accès global SI transmis
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        
        if ($user->isAdminGlobally() || ($isGlobalManager && $projet->transmis_gestionnaire)) {
            return true;
        }

        // Sinon, vérifier si l'utilisateur est explicitement Chef ou Gestionnaire sur CE projet précis
        $participation = ParticipationProjet::where('id_projet', $projet->id)
            ->where('id_utilisateur', $user->id)
            ->where('statut', 'actif')
            ->first();

        return $participation && in_array($participation->role_projet, ['chef_projet', 'gestionnaire', 'architecte']);
    }

    /**
     * Vérifie qu'un utilisateur est membre actif d'un projet.
     */
    private function estMembreActif(int $idUtilisateur, int $idProjet): bool
    {
        return ParticipationProjet::where('id_projet', $idProjet)
            ->where('id_utilisateur', $idUtilisateur)
            ->where('statut', 'actif')
            ->exists();
    }

    // ─── Endpoints ───────────────────────────────────────────────────────────────

    /**
     * GET /api/projets/{id}/equipe
     * Retourne tous les membres du projet avec leurs informations complètes.
     */
    public function index(Request $request, int $id): JsonResponse
    {
        $projet = Projet::findOrFail($id);
        $user = $request->user();

        // Vérification accès : admin, membre du projet, ou Gestionnaire/Superviseur si le projet est transmis
        $isAdmin = $user->isAdminGlobally();
        $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
        $isMembre = $this->estMembreActif($user->id, $projet->id);
        
        if (!$isAdmin && !$isMembre && !($isGlobalManager && $projet->transmis_gestionnaire)) {
            return response()->json(['message' => 'Accès non autorisé à ce projet.'], 403);
        }

        $membres = ParticipationProjet::where('id_projet', $id)
            ->with(['utilisateur:id,nom,prenom,email,telephone,fonction,actif'])
            ->orderBy('role_projet')
            ->get()
            ->map(fn($p) => [
                'participation_id'  => $p->id,
                'role_projet'       => $p->role_projet,
                'statut'            => $p->statut,
                'date_affectation'  => $p->date_affectation,
                'utilisateur'       => $p->utilisateur,
            ]);

        return response()->json([
            'projet_id' => $projet->id,
            'titre'     => $projet->titre,
            'membres'   => $membres,
            'total'     => $membres->count(),
        ]);
    }

    /**
     * POST /api/projets/{id}/equipe
     * Ajoute un utilisateur à l'équipe projet ou met à jour son rôle.
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $projet = Projet::findOrFail($id);
        $user = $request->user();

        if (!$this->peutGererEquipe($user, $projet)) {
            return response()->json(['message' => 'Seul le Chef de projet, le Gestionnaire ou un Administrateur peut ajouter des membres.'], 403);
        }

        $validated = $request->validate([
            'id_utilisateur' => 'required|integer|exists:utilisateurs,id',
            'role_projet'    => 'required|string|in:' . implode(',', self::ROLES_PROJET),
        ]);

        // Vérifier que l'utilisateur cible est bien actif dans le système
        $cible = Utilisateur::findOrFail($validated['id_utilisateur']);
        if (!$cible->actif) {
            return response()->json(['message' => 'Impossible d\'ajouter un compte désactivé à l\'équipe.'], 422);
        }

        $participation = ParticipationProjet::updateOrCreate(
            [
                'id_projet'      => $projet->id,
                'id_utilisateur' => $validated['id_utilisateur'],
            ],
            [
                'role_projet'      => $validated['role_projet'],
                'statut'           => 'actif',
                'date_affectation' => now(),
            ]
        );

        return response()->json(
            $participation->load('utilisateur:id,nom,prenom,email,fonction'),
            201
        );
    }

    /**
     * PATCH /api/projets/{id}/equipe/{participationId}
     * Modifie le rôle d'un membre existant dans l'équipe.
     */
    public function updateRole(Request $request, int $id, int $participationId): JsonResponse
    {
        $projet = Projet::findOrFail($id);
        $user = $request->user();

        if (!$this->peutGererEquipe($user, $projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $participation = ParticipationProjet::where('id_projet', $id)
            ->where('id', $participationId)
            ->firstOrFail();

        $validated = $request->validate([
            'role_projet' => 'required|string|in:' . implode(',', self::ROLES_PROJET),
        ]);

        // Règle : si on dégrade quelqu'un de chef_projet,
        // vérifier qu'il reste au moins un autre chef actif
        if ($participation->role_projet === 'chef_projet' && $validated['role_projet'] !== 'chef_projet') {
            $nbChefs = ParticipationProjet::where('id_projet', $id)
                ->where('role_projet', 'chef_projet')
                ->where('statut', 'actif')
                ->where('id', '!=', $participationId)
                ->count();

            if ($nbChefs === 0) {
                return response()->json([
                    'message' => 'Impossible de modifier ce rôle : ce membre est le seul Chef de projet actif. Désignez d\'abord un autre Chef de projet.',
                ], 422);
            }
        }

        $participation->update(['role_projet' => $validated['role_projet']]);

        return response()->json($participation->load('utilisateur:id,nom,prenom,email,fonction'));
    }

    /**
     * DELETE /api/projets/{id}/equipe/{participationId}
     * Retire un membre de l'équipe projet (désactivation logique, conservation de l'historique).
     */
    public function destroy(Request $request, int $id, int $participationId): JsonResponse
    {
        $projet = Projet::findOrFail($id);
        $user = $request->user();

        if (!$this->peutGererEquipe($user, $projet)) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $participation = ParticipationProjet::where('id_projet', $id)
            ->where('id', $participationId)
            ->firstOrFail();

        // Règle métier : on ne peut pas retirer le dernier chef de projet
        if ($participation->role_projet === 'chef_projet') {
            $nbChefs = ParticipationProjet::where('id_projet', $id)
                ->where('role_projet', 'chef_projet')
                ->where('statut', 'actif')
                ->where('id', '!=', $participationId)
                ->count();

            if ($nbChefs === 0) {
                return response()->json([
                    'message' => 'Impossible de retirer le seul Chef de projet. Désignez d\'abord un remplaçant.',
                ], 422);
            }
        }

        // Désactivation logique (on conserve l'historique)
        $participation->update(['statut' => 'retire']);

        // Réaffectation automatique : les tâches du projet assignées à ce membre
        // dont il est responsable passent sans responsable (à réaffecter manuellement)
        $tachesAffectees = Tache::where('id_projet', $projet->id)
            ->where('id_responsable', $participation->id_utilisateur)
            ->whereNotIn('statut', ['terminee', 'archivee'])
            ->get();

        if ($tachesAffectees->isNotEmpty()) {
            return response()->json([
                'message'           => 'Membre retiré avec succès. Attention : ce membre était responsable de tâches en cours.',
                'taches_sans_resp'  => $tachesAffectees->pluck('id', 'titre'),
                'action_requise'    => 'Réaffectez ces tâches via PATCH /api/taches/{id}/responsable',
            ], 200);
        }

        return response()->json(['message' => 'Membre retiré de l\'équipe avec succès.'], 200);
    }

    /**
     * PATCH /api/taches/{id}/responsable
     * Réaffecte le responsable d'une tâche.
     * Le nouveau responsable doit impérativement être membre actif du projet.
     */
    public function reaffecterResponsable(Request $request, int $idTache): JsonResponse
    {
        $tache = Tache::findOrFail($idTache);
        $user = $request->user();

        // Récupérer le projet lié à la tâche (via activité ou directement)
        $idProjet = $tache->id_projet;
        if (!$idProjet && $tache->id_activite) {
            $idProjet = $tache->activite?->phase?->id_projet
                     ?? $tache->activite?->id_projet;
        }

        if (!$idProjet) {
            return response()->json(['message' => 'Impossible de déterminer le projet de cette tâche.'], 422);
        }

        $projet = Projet::findOrFail($idProjet);

        // Seuls le chef de projet, gestionnaire ou admin peuvent réaffecter
        if (!$this->peutGererEquipe($user, $projet)) {
            return response()->json(['message' => 'Seul le Chef de projet, le Gestionnaire ou un Administrateur peut réaffecter les responsables.'], 403);
        }

        $validated = $request->validate([
            'id_responsable' => 'required|integer|exists:utilisateurs,id',
        ]);

        // Règle critique : le nouveau responsable doit être membre actif du projet
        if (!$this->estMembreActif($validated['id_responsable'], $idProjet)) {
            return response()->json([
                'message' => 'Le nouveau responsable doit être membre actif de ce projet. Ajoutez-le d\'abord à l\'équipe.',
            ], 422);
        }

        $ancienResponsableId = $tache->id_responsable;
        $tache->update(['id_responsable' => $validated['id_responsable']]);

        return response()->json([
            'message'              => 'Responsable réaffecté avec succès.',
            'tache'                => $tache->load('responsable:id,nom,prenom,email'),
            'ancien_responsable_id' => $ancienResponsableId,
        ]);
    }

    /**
     * GET /api/utilisateurs/disponibles?projet_id={id}
     * Liste les utilisateurs actifs qui ne sont PAS encore membres du projet.
     * Utilisé par le front pour pré-remplir les listes déroulantes.
     */
    public function utilisateursDispo(Request $request): JsonResponse
    {
        $request->validate([
            'projet_id' => 'required|integer|exists:projets,id',
        ]);

        $idProjet = $request->query('projet_id');

        // IDs des membres déjà actifs du projet
        $dejaMembres = ParticipationProjet::where('id_projet', $idProjet)
            ->where('statut', 'actif')
            ->pluck('id_utilisateur');

        $utilisateurs = Utilisateur::where('actif', true)
            ->whereNotIn('id', $dejaMembres)
            ->select('id', 'nom', 'prenom', 'email', 'fonction')
            ->orderBy('nom')
            ->get();

        return response()->json($utilisateurs);
    }
}
