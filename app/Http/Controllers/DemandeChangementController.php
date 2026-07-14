<?php

namespace App\Http\Controllers;

use App\Models\DemandeChangement;
use App\Models\Projet;
use App\Models\ParticipationProjet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandeChangementController extends Controller
{
    /**
     * Récupère toutes les demandes de changement accessibles par l'utilisateur.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);
        
        // Liste des projets où l'utilisateur est actif
        $myProjectIds = [];
        if (!$isAdmin) {
            $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
            
            $globalManaged = [];
            if ($isGlobalManager) {
                $globalManaged = Projet::where('transmis_gestionnaire', true)->pluck('id')->toArray();
            }

            $localParticipations = ParticipationProjet::where('id_utilisateur', $user->id)
                ->where('statut', 'actif')
                ->pluck('id_projet')->toArray();

            $myProjectIds = array_unique(array_merge($globalManaged, $localParticipations));
        }

        $demandes = DemandeChangement::with('demandeur')->orderBy('created_at', 'desc')->get();

        // Préchargement des rôles de l'utilisateur sur tous ses projets pour éviter le N+1
        $userRoles = [];
        if (!$isAdmin) {
            $userRoles = ParticipationProjet::where('id_utilisateur', $user->id)
                ->where('statut', 'actif')
                ->pluck('role_projet', 'id_projet')
                ->toArray();
        }

        // Ajout dynamique du nom de la cible et filtrage
        $filteredDemandes = [];
        foreach ($demandes as $demande) {
            $cible = $demande->getCible();
            if (!$cible) continue;

            // Déterminer l'ID du projet de la cible pour vérifier les droits
            $idProjetCible = null;
            $nomCible = 'Inconnu';
            switch ($demande->type_cible) {
                case 'projet':
                    $idProjetCible = $cible->id;
                    $nomCible = 'Projet : ' . $cible->titre;
                    break;
                case 'phase':
                    $idProjetCible = $cible->id_projet;
                    $nomCible = 'Phase : ' . $cible->nom_phase;
                    break;
                case 'activite':
                    $idProjetCible = $cible->phase ? $cible->phase->id_projet : null;
                    $nomCible = 'Activité : ' . $cible->titre;
                    break;
                case 'tache':
                    $idProjetCible = $cible->projet ? $cible->projet->id : ($cible->activite && $cible->activite->phase ? $cible->activite->phase->id_projet : null);
                    $nomCible = 'Tâche : ' . $cible->titre;
                    break;
                case 'reunion':
                    $idProjetCible = $cible->id_projet;
                    $nomCible = 'Réunion : ' . $cible->titre;
                    break;
            }

            // Vérifier l'accès
            if ($isAdmin || in_array($idProjetCible, $myProjectIds)) {
                $demande->nom_cible = $nomCible;
                $demande->id_projet_cible = $idProjetCible;
                
                // Déterminer si l'utilisateur courant peut valider cette demande
                // Seuls Admin, Chef de projet ou Gestionnaire du projet peuvent valider.
                $canValidate = false;
                if ($isAdmin) {
                    $canValidate = true;
                } else {
                    $roleInProject = $userRoles[$idProjetCible] ?? null;
                    
                    if (in_array($roleInProject, ['chef_projet', 'gestionnaire', 'architecte'])) {
                        $canValidate = true;
                    } elseif ($isGlobalManager && in_array($idProjetCible, $globalManaged)) {
                        $canValidate = true;
                    }
                }
                
                $demande->can_validate = $canValidate;
                $filteredDemandes[] = $demande;
            }
        }

        return response()->json($filteredDemandes);
    }

    /**
     * Créer une nouvelle demande de changement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type_cible' => 'required|string|in:projet,phase,activite,tache,reunion',
            'id_cible' => 'required|integer',
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'justification' => 'nullable|string',
            'niveau_approbation' => 'nullable|string|in:gestionnaire,chef_projet,superviseur',
        ]);

        $demande = new DemandeChangement($validated);
        $demandeur = $request->user();
        $demande->id_demandeur = $demandeur->id;
        $demande->statut = 'en_attente';
        $demande->niveau_approbation = $validated['niveau_approbation'] ?? 'gestionnaire';
        $demande->save();

        // ── Notifications ──
        $notifiableIds = [];
        $id_projet = null;

        // Récupération de l'ID du projet concerné
        if ($demande->type_cible === 'projet') {
            $id_projet = $demande->id_cible;
        } else {
            $cible = $demande->getCible();
            if ($cible) {
                switch ($demande->type_cible) {
                    case 'phase': $id_projet = $cible->id_projet; break;
                    case 'activite': $id_projet = $cible->phase ? $cible->phase->id_projet : null; break;
                    case 'tache': $id_projet = $cible->projet ? $cible->projet->id : ($cible->activite && $cible->activite->phase ? $cible->activite->phase->id_projet : null); break;
                    case 'reunion': $id_projet = $cible->id_projet; break;
                }
            }
        }

        if ($id_projet) {
            $projet = \App\Models\Projet::find($id_projet);

            // Chefs de projet et gestionnaires locaux
            $localManagers = \App\Models\ParticipationProjet::where('id_projet', $id_projet)
                ->whereIn('role_projet', ['chef_projet', 'gestionnaire', 'architecte'])
                ->where('statut', 'actif')
                ->pluck('id_utilisateur')->toArray();
            $notifiableIds = array_merge($notifiableIds, $localManagers);

            // Gestionnaires globaux (si le projet leur est transmis)
            if ($projet && $projet->transmis_gestionnaire) {
                $globalManagers = \App\Models\Utilisateur::whereIn('fonction', ['Gestionnaire', 'Gestionnaire de projet'])
                    ->pluck('id')->toArray();
                $notifiableIds = array_merge($notifiableIds, $globalManagers);
            }
        }

        // Nettoyage : retirer les doublons et le demandeur lui-même
        $notifiableIds = array_unique($notifiableIds);
        $notifiableIds = array_filter($notifiableIds, fn($id) => $id !== $demandeur->id);

        foreach ($notifiableIds as $userId) {
            $notif = \App\Models\Notification::create([
                'type_evenement' => 'demande_changement',
                'titre' => 'Nouvelle demande de changement',
                'contenu' => "Une demande de changement \"{$demande->titre}\" a été soumise par {$demandeur->prenom} {$demandeur->nom}.",
                'type_cible' => $demande->type_cible,
                'id_cible' => $demande->id_cible,
                'id_emetteur' => $demandeur->id,
            ]);

            \App\Models\NotificationDestinataire::create([
                'id_notification' => $notif->id,
                'id_utilisateur' => $userId,
                'est_lue' => false,
            ]);
        }

        return response()->json([
            'message' => 'Demande de changement soumise avec succès.',
            'demande' => $demande->load('demandeur')
        ], 201);
    }

    /**
     * Mettre à jour le statut (Approuver, Rejeter, etc.).
     */
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $demande = DemandeChangement::findOrFail($id);
        $user = $request->user();
        $isAdmin = in_array($user->fonction, ['Administrateur', 'Administrateur système']);

        // Vérification des droits (doit être manager du projet ciblé)
        $cible = $demande->getCible();
        $idProjetCible = null;
        if ($cible) {
            switch ($demande->type_cible) {
                case 'projet': $idProjetCible = $cible->id; break;
                case 'phase': $idProjetCible = $cible->id_projet; break;
                case 'activite': $idProjetCible = $cible->phase ? $cible->phase->id_projet : null; break;
                case 'tache': $idProjetCible = $cible->projet ? $cible->projet->id : ($cible->activite && $cible->activite->phase ? $cible->activite->phase->id_projet : null); break;
                case 'reunion': $idProjetCible = $cible->id_projet; break;
            }
        }

        $canValidate = false;
        if ($isAdmin) {
            $canValidate = true;
        } elseif ($idProjetCible) {
            $roleInProject = ParticipationProjet::where('id_projet', $idProjetCible)
                        ->where('id_utilisateur', $user->id)
                        ->where('statut', 'actif')
                        ->value('role_projet');
            if (in_array($roleInProject, ['chef_projet', 'gestionnaire', 'architecte'])) {
                $canValidate = true;
            } else {
                $isGlobalManager = ($user->hasRole('Gestionnaire de projet') && $user->fonction !== 'Chef de projet' && $user->fonction !== 'Architecte de projet');
                if ($isGlobalManager) {
                    $isTransmis = Projet::where('id', $idProjetCible)->value('transmis_gestionnaire');
                    if ($isTransmis) $canValidate = true;
                }
            }
        }

        if (!$canValidate) {
            return response()->json(['message' => 'Accès non autorisé. Vous n\'avez pas les droits pour statuer sur cette demande.'], 403);
        }

        $validated = $request->validate([
            'statut' => 'required|in:en_attente,acceptee,refusee,annulee',
            'commentaire_decision' => 'nullable|string',
        ]);
        
        $demande->statut = $validated['statut'];
        $demande->commentaire_decision = $validated['commentaire_decision'] ?? null;
        $demande->date_traitement = now();
        $demande->save();

        // ── Notification de décision au demandeur ──
        if (in_array($demande->statut, ['acceptee', 'refusee'])) {
            $etatFR = $demande->statut === 'acceptee' ? 'acceptée' : 'refusée';
            $contenuNotif = "Votre demande de changement \"{$demande->titre}\" a été {$etatFR}.";
            if ($demande->commentaire_decision) {
                $contenuNotif .= " Commentaire du gestionnaire : " . $demande->commentaire_decision;
            }

            $notif = \App\Models\Notification::create([
                'type_evenement' => 'demande_changement',
                'titre' => "Demande de changement {$etatFR}",
                'contenu' => $contenuNotif,
                'type_cible' => $demande->type_cible,
                'id_cible' => $demande->id_cible,
                'id_emetteur' => $user->id,
            ]);

            \App\Models\NotificationDestinataire::create([
                'id_notification' => $notif->id,
                'id_utilisateur' => $demande->id_demandeur,
                'est_lue' => false,
            ]);
        }

        return response()->json([
            'message' => 'Statut de la demande mis à jour.',
            'demande' => $demande->load('demandeur')
        ]);
    }
}
