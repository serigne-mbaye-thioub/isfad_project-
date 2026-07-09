/**
 * Permissions utilitaires
 */

const ROLE_ADMIN = 'Administrateur';
const ROLE_ADMIN_SYS = 'Administrateur système';
const ROLE_GESTIONNAIRE = 'Gestionnaire de projet';
const ROLE_SUPERVISEUR = 'Superviseur';
const ROLE_CHEF_PROJET = 'Chef de projet';
const ROLE_ARCHITECTE = 'Architecte';

/**
 * Vérifie si l'utilisateur est un Administrateur global
 */
export const isAdmin = (user) => {
    return user && [ROLE_ADMIN, ROLE_ADMIN_SYS].includes(user.fonction);
};

/**
 * Vérifie si l'utilisateur a des droits de supervision globale
 */
export const isGlobalManager = (user) => {
    if (!user) return false;
    return isAdmin(user) || user.roles?.includes(ROLE_GESTIONNAIRE) || user.roles?.includes(ROLE_SUPERVISEUR);
};

/**
 * Vérifie si l'utilisateur a le droit de gérer ce projet spécifique
 */
export const canManageProject = (user, project) => {
    if (!user || !project) return false;
    
    if (isAdmin(user)) return true;
    
    // Le créateur a des droits
    if (project.id_createur === user.id) return true;
    
    // Gestionnaire si le projet a été transmis
    if (isGlobalManager(user) && project.transmis_gestionnaire) return true;
    
    // Rôle spécifique dans le projet (participation)
    if (project.participations) {
        const participation = project.participations.find(p => p.id_utilisateur === user.id && p.statut === 'actif');
        if (participation) {
            return ['chef_projet', 'gestionnaire', 'architecte'].includes(participation.role_projet);
        }
    }
    
    return false;
};

export default {
    isAdmin,
    isGlobalManager,
    canManageProject
};
