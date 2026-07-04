import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Calendar, Bell, LogOut, ChevronDown, Shield, FileText } from 'lucide-react';
import api from '../axios';

const DashboardLayout = () => {
    const navigate = useNavigate();
    // Bug fix #6 : lire l'utilisateur depuis localStorage (mis à jour au login)
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('auth_user')) || { nom: '...', prenom: '', fonction: '' };
        } catch {
            return { nom: '...', prenom: '', fonction: '' };
        }
    });

    // Synchroniser depuis l'API pour avoir des données fraîches
    useEffect(() => {
        api.get('/api/me').then(res => {
            const u = res.data.utilisateur || res.data;
            setUser(u);
            localStorage.setItem('auth_user', JSON.stringify(u));
        }).catch(() => {});
    }, []);

    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await api.get('/api/notifications');
                setNotifications(res.data);
            } catch (e) { console.error(e); }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000); // Rafraîchir toutes les minutes
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.est_lue).length;

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, est_lue: true } : n));
        } catch (e) {}
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, est_lue: true })));
        } catch (e) {}
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
        } catch (e) {
            // On efface de toute façon
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            navigate('/login');
        }
    };

    const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() || 'U';

    // Bug fix #7 : utiliser NavLink de React Router (pas href="#")
    const navItems = [
        { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
        { to: '/projets', icon: <FolderKanban size={17} />, label: 'Projets' },
        { to: '/reunions', icon: <Calendar size={17} />, label: 'Réunions' },
    ];



    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

            {/* ── Sidebar ── */}
            <aside className="w-60 bg-[#071525] text-white flex flex-col shadow-2xl z-30 flex-shrink-0">

                {/* Logo */}
                <div className="px-5 py-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0564A8] rounded-lg flex items-center justify-center font-black text-xs shadow-md">
                            ISFAD
                        </div>
                        <div>
                            <p className="text-[13px] font-extrabold text-white tracking-wide leading-tight">Gouvernance</p>
                            <p className="text-[10px] text-blue-400 tracking-widest uppercase">UCAD · DAKAR</p>
                        </div>
                    </div>
                </div>

                {/* Navigation principale */}
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-3 mb-3">Navigation</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-[#0564A8] text-white shadow-md shadow-blue-900/50'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Modules Bientôt Disponibles */}
                    <div className="pt-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-3 mb-3 mt-4">Modules Additionnels</p>
                        
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500/50 cursor-not-allowed" title="Bientôt disponible">
                            <Wallet size={17} />
                            <span>Budget</span>
                            <span className="ml-auto text-[8px] uppercase font-black bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Bientôt</span>
                        </div>

                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500/50 cursor-not-allowed" title="Bientôt disponible">
                            <FileText size={17} />
                            <span>Demandes de chgt.</span>
                            <span className="ml-auto text-[8px] uppercase font-black bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Bientôt</span>
                        </div>
                    </div>

                    {/* Section Administration (Restreinte) */}
                    {['Administrateur', 'Administrateur système'].includes(user.fonction) && (
                        <div className="pt-6">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-3 mb-3">Administration</p>
                            <NavLink
                                to="/admin/utilisateurs"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                        isActive ? 'bg-[#0564A8] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                <Users size={17} />
                                <span>Utilisateurs</span>
                            </NavLink>
                            <NavLink
                                to="/admin/audits"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                        isActive ? 'bg-[#0564A8] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                <FileText size={17} />
                                <span>Journal d'Audit</span>
                            </NavLink>
                        </div>
                    )}


                </nav>

                {/* Profil en bas */}
                <div className="px-3 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition group">
                        <div className="w-8 h-8 rounded-full bg-[#00ACEF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user.prenom} {user.nom}</p>
                            <p className="text-[10px] text-gray-400 truncate">{user.fonction}</p>
                        </div>
                        <button onClick={handleLogout} title="Se déconnecter" className="text-gray-500 hover:text-red-400 transition">
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Contenu Principal ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar */}
                <header className="h-14 bg-white border-b border-gray-100 flex items-center px-8 justify-between flex-shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-2">
                        {/* Fil d'Ariane dynamique — à enrichir selon la page */}
                        <span className="text-gray-400 text-sm">ISFAD Gouvernance</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Cloche de notifications */}
                        <div className="relative">
                            <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-gray-400 hover:text-[#0564A8] transition">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3834] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Dropdown Notifications */}
                            {showNotifs && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[400px]">
                                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="text-[10px] font-bold text-[#0564A8] hover:underline">Tout marquer comme lu</button>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-gray-400">Aucune notification</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => !n.est_lue && markAsRead(n.id)}
                                                    className={`p-3 border-b border-gray-50 cursor-pointer transition ${n.est_lue ? 'opacity-60' : 'bg-blue-50/30 hover:bg-blue-50/60'}`}
                                                >
                                                    <p className="text-xs font-bold text-gray-900">{n.notification?.titre || 'Notification'}</p>
                                                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.notification?.contenu}</p>
                                                    <p className="text-[9px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Avatar */}
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <div className="w-8 h-8 rounded-full bg-[#0564A8] flex items-center justify-center text-xs font-bold text-white">
                                {initials}
                            </div>
                            <div className="hidden md:block text-right">
                                <p className="text-xs font-bold text-gray-800 leading-tight">{user.prenom} {user.nom}</p>
                                <p className="text-[10px] text-gray-400">{user.fonction}</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition" />
                        </div>
                    </div>
                </header>

                {/* Zone de contenu */}
                <main className="flex-1 overflow-y-auto bg-[#f0f4f8] p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
