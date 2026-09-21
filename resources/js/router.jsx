import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ListeProjets from './pages/Projets/ListeProjets';
import ProjetDetail from './pages/Projets/ProjetDetail';
import Demandes from './pages/Demandes/Index';
import Reunions from './pages/Reunions/Index';
import Notifications from './pages/Notifications';
import MesTaches from './pages/MesTaches';
import AvancementGlobal from './pages/Projets/AvancementGlobal';
import UtilisateursAdmin from './pages/Admin/UtilisateursAdmin';
import JournalAudit from './pages/Admin/JournalAudit';
import Calendrier from './pages/Calendrier/Index';
import Profil from './pages/Profil';
import Parametres from './pages/Parametres';
import Personnalisation from './pages/Personnalisation';
import Aide from './pages/Aide';
import RapportRedirector from './pages/RapportRedirector';

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
            {
                path: 'projets/avancement',
                element: <AvancementGlobal />,
            },
            {
                path: 'projets',
                element: <ListeProjets />,
            },
            {
                path: 'projets/:id',
                element: <ProjetDetail />,
            },
            {
                path: 'rapports/:id',
                element: <RapportRedirector />,
            },
            {
                path: 'mes-taches',
                element: <MesTaches />,
            },
            {
                path: 'demandes',
                element: <Demandes />,
            },
            {
                path: 'reunions',
                element: <Reunions />,
            },
            {
                path: 'notifications',
                element: <Notifications />,
            },
            {
                path: 'profil',
                element: <Profil />,
            },
            {
                path: 'parametres',
                element: <Parametres />,
            },
            {
                path: 'personnalisation',
                element: <Personnalisation />,
            },
            {
                path: 'aide',
                element: <Aide />,
            },
            {
                path: 'calendrier',
                element: <Calendrier />,
            },
            {
                path: 'admin/utilisateurs',
                element: <UtilisateursAdmin />,
            },
            {
                path: 'admin/audits',
                element: <JournalAudit />,
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
