import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Calendar, Bell, LogOut, ChevronDown, Shield, FileText, Wallet, Inbox, Video, Sparkles, Settings, User, HelpCircle, ChevronRight, ListTodo } from 'lucide-react';
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
    
    // Nouveaux états pour le grand popup global
    const [showGlobalPopup, setShowGlobalPopup] = useState(false);
    const [dismissedNotifIds, setDismissedNotifIds] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem('dismissed_notifs')) || [];
        } catch {
            return [];
        }
    });
    
    // État pour le menu de profil
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);

    // Clic en dehors pour fermer le menu profil
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/api/notifications');
            const notifs = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setNotifications(notifs);
            
            // Vérifier s'il y a des notifications non lues et non acquittées
            const unreadNotifs = notifs.filter(n => !n.est_lue);
            let currentDismissed = [];
            try { currentDismissed = JSON.parse(sessionStorage.getItem('dismissed_notifs')) || []; } catch {}
            
            const hasNew = unreadNotifs.some(n => !currentDismissed.includes(n.id));
            if (hasNew) {
                setShowGlobalPopup(true);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
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
            setShowGlobalPopup(false);
        } catch (e) {}
    };

    const handleCloseGlobalPopup = () => {
        setShowGlobalPopup(false);
        const unreadIds = notifications.filter(n => !n.est_lue).map(n => n.id);
        const newDismissed = [...new Set([...dismissedNotifIds, ...unreadIds])];
        setDismissedNotifIds(newDismissed);
        sessionStorage.setItem('dismissed_notifs', JSON.stringify(newDismissed));
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            sessionStorage.removeItem('dismissed_notifs');
            navigate('/login');
        }
    };

    const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() || 'U';

    const navItems = [
        { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
        { to: '/projets', icon: <FolderKanban size={17} />, label: 'Projets' },
        { to: '/mes-taches', icon: <ListTodo size={17} />, label: 'Mes Tâches' },
        { to: '/reunions', icon: <Video size={17} />, label: 'Réunions' },
        { to: '/demandes', icon: <Inbox size={17} />, label: 'Demandes' },
        { to: '/calendrier', icon: <Calendar size={17} />, label: 'Calendrier' },
        { to: '/notifications', icon: <Bell size={17} />, label: 'Notifications' }
    ];



    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

            {/* ── Sidebar ── */}
            <aside className="w-60 bg-[#071525] text-white flex flex-col shadow-2xl z-30 flex-shrink-0">

                {/* Logo */}
                <div className="px-4 py-5 border-b border-white/5 flex justify-center">
                    <Link to="/dashboard" className="bg-white rounded-xl p-2 shadow-lg inline-block hover:scale-105 transition-transform cursor-pointer">
                        <img src="/images/logo_isfad.jpeg" alt="Logo ISFAD UCAD" className="h-12 w-auto object-contain" />
                    </Link>
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
                            {item.to === '/notifications' && unreadCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </NavLink>
                    ))}

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
                <div className="px-3 py-4 border-t border-white/5 relative" ref={profileMenuRef}>
                    
                    {/* Menu Popup Flottant */}
                    {isProfileMenuOpen && (
                        <div className="absolute bottom-full mb-2 left-3 right-3 bg-[#071525] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            
                            {/* En-tête profil dans le menu */}
                            <Link to="/profil" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center justify-between p-4 hover:bg-white/5 transition border-b border-white/5 group">
                                <div className="flex items-center gap-3">
                                    {user?.photo_profil_url ? (
                                        <img src={user.photo_profil_url} alt="Profil" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-white">{user.prenom} {user.nom}</p>
                                        <p className="text-xs text-gray-400">{user.fonction}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition" />
                            </Link>

                            {/* Liens */}
                            <div className="p-2 space-y-1">
                                <Link to="/personnalisation" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
                                    <Sparkles size={18} className="text-gray-400" /> Personnalisation
                                </Link>
                                <Link to="/profil" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
                                    <User size={18} className="text-gray-400" /> Profil
                                </Link>
                                <Link to="/parametres" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
                                    <Settings size={18} className="text-gray-400" /> Paramètres
                                </Link>
                            </div>

                            <div className="h-px bg-white/5 my-1 mx-2"></div>

                            {/* Liens bas */}
                            <div className="p-2 space-y-1">
                                <Link to="/aide" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition group">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle size={18} className="text-gray-400" /> Aide
                                    </div>
                                    <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition" />
                                </Link>
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-400/10 transition text-left">
                                    <LogOut size={18} className="text-gray-400" /> Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trigger du menu */}
                    <div 
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${isProfileMenuOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            {user?.photo_profil_url ? (
                                <img src={user.photo_profil_url} alt="Profil" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0 max-w-[120px]">
                                <p className="text-xs font-bold text-white truncate">{user.prenom} {user.nom}</p>
                                <p className="text-[10px] text-gray-400 truncate">{user.fonction}</p>
                            </div>
                        </div>
                        <div className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap hidden md:block">
                            ISFAD
                        </div>
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
                        {/* Cloche de notifications (lien vers la page dédiée) */}
                        <div className="relative">
                            <NavLink to="/notifications" className={({ isActive }) => `relative transition ${isActive ? 'text-[#0564A8]' : 'text-gray-400 hover:text-[#0564A8]'}`}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3834] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </NavLink>
                        </div>
                        {/* Fin Cloche */}
                        {/* Avatar */}
                        <div className="flex items-center gap-2 cursor-pointer group">
                            {user?.photo_profil_url ? (
                                <img src={user.photo_profil_url} alt="Profil" className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#0564A8] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Zone de contenu */}
                <main className="flex-1 overflow-y-auto bg-[#f0f4f8] p-8">
                    <Outlet context={{ notifications, markAsRead, markAllAsRead, fetchNotifs, setNotifications }} />
                </main>
            </div>

            {/* GRAND POPUP DE NOTIFICATION GLOBAL */}
            {showGlobalPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                        <div className="bg-[#0564A8] p-5 text-center relative">
                            <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                <Bell size={24} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Vous avez de nouvelles notifications !</h2>
                            <button onClick={handleCloseGlobalPopup} className="absolute top-4 right-4 text-white/70 hover:text-white transition bg-white/10 hover:bg-white/20 rounded-full p-1.5">
                                <LogOut size={18} className="rotate-180" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                {notifications.filter(n => !n.est_lue).slice(0, 5).map(notif => (
                                    <div key={notif.id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                                        <div className="bg-blue-100 p-2 rounded-lg text-[#0564A8] mt-1">
                                            {notif.notification?.type_evenement === 'reunion' ? <Video size={18} /> : <Sparkles size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{notif.notification?.titre}</p>
                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.notification?.contenu}</p>
                                        </div>
                                    </div>
                                ))}
                                {unreadCount > 5 && (
                                    <p className="text-center text-sm font-medium text-gray-500 mt-2">
                                        Et {unreadCount - 5} autre(s) notification(s)...
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                            <button 
                                onClick={handleCloseGlobalPopup}
                                className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition text-sm"
                            >
                                Plus tard
                            </button>
                            <Link 
                                to="/notifications" 
                                onClick={handleCloseGlobalPopup}
                                className="px-5 py-2 bg-[#0564A8] text-white font-bold rounded-xl hover:bg-[#044c80] transition shadow-sm text-sm"
                            >
                                Voir toutes les notifications
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
