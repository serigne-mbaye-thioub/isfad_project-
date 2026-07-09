import React, { useEffect, useState } from 'react';
import api from '../axios';
import { Bell, AlertTriangle, CheckCircle, Info, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000); // Rafraîchir toutes les minutes
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, est_lue: true })));
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, est_lue: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Chargement des notifications...</div>;

    const getIconAndColor = (type) => {
        switch (type) {
            case 'alerte':
            case 'retard':
                return { icon: <AlertTriangle size={20} className="text-orange-500" />, border: 'border-l-orange-500' };
            case 'succes':
            case 'archive':
                return { icon: <CheckCircle size={20} className="text-emerald-500" />, border: 'border-l-emerald-500' };
            case 'changement':
            case 'reunion':
            case 'projet_transmis':
                return { icon: <FileText size={20} className="text-amber-500" />, border: 'border-l-amber-500' };
            default:
                return { icon: <Info size={20} className="text-[#0564A8]" />, border: 'border-l-[#0564A8]' };
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 flex-shrink-0 gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">{notifications.length} notification(s)</p>
                </div>
                {notifications.some(n => !n.est_lue) && (
                    <button 
                        onClick={markAllAsRead} 
                        className="bg-white border border-[#0564A8] text-[#0564A8] px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                    >
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        Aucune notification pour le moment.
                    </div>
                ) : (
                    notifications.map(n => {
                        const notif = n.notification || {};
                        const type = notif.type_evenement || 'info';
                        const { icon, border } = getIconAndColor(type);
                        
                        return (
                            <div 
                                key={n.id}
                                onClick={() => !n.est_lue && markAsRead(n.id)}
                                className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-l-4 ${border} flex items-start gap-4 transition-all ${!n.est_lue ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
                            >
                                <div className="mt-1 flex-shrink-0 bg-gray-50 p-3 rounded-full">
                                    {icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-4 mb-1">
                                        <h3 className={`text-base font-extrabold ${!n.est_lue ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notif.titre || 'Notification'}
                                        </h3>
                                        {!n.est_lue && (
                                            <span className="w-2.5 h-2.5 bg-[#0564A8] rounded-full flex-shrink-0 mt-1 shadow-sm"></span>
                                        )}
                                    </div>
                                    
                                    {notif.contenu && (
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                            {notif.contenu}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                                            {new Date(n.created_at).toLocaleDateString('fr-FR')} à {new Date(n.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        
                                        {/* Action link based on type_cible */}
                                        {notif.type_cible === 'projet' && notif.id_cible && (
                                            <Link 
                                                to={`/projets/${notif.id_cible}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0564A8] hover:text-[#044c80] hover:underline"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                Voir le projet <ArrowRight size={14} />
                                            </Link>
                                        )}
                                        {notif.type_cible === 'reunion' && notif.id_cible && (
                                            <Link 
                                                to={`/reunions#${notif.type_evenement === 'reunion' ? 'demande-' : 'reunion-'}${notif.id_cible}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0564A8] hover:text-[#044c80] hover:underline"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                Voir la réunion <ArrowRight size={14} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Notifications;
