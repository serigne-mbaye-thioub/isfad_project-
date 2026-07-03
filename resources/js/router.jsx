import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Bug fix #3 : plus de chevauchement de routes sur '/'.
// Bug fix #8 : ProtectedRoute enveloppe les pages sécurisées.
const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/change-password',
        element: <ChangePassword />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
        ],
    },
    // Fallback : toute URL inconnue redirige vers le login
    {
        path: '*',
        element: <Navigate to="/login" replace />,
    },
]);

export default router;
