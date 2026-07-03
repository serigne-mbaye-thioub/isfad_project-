import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — Bug fix #8
 * Empêche tout accès aux routes sécurisées si aucun token n'est stocké.
 */
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default ProtectedRoute;
