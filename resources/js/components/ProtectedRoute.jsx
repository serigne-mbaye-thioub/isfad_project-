import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — Bug fix #8
 * Empêche tout accès aux routes sécurisées si aucun token n'est stocké.
 */
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.premiere_connexion) {
                return <Navigate to="/change-password" replace />;
            }
        } catch (e) {
            console.error("Erreur parsing auth_user", e);
        }
    }

    return children;
};

export default ProtectedRoute;
