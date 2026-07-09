import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Users, FolderKanban, AlertTriangle, TrendingUp, Wallet, Clock, Activity, Target,
    Folder, CheckSquare, Settings, Phone, BellRing, User, AlertCircle
} from 'lucide-react';

const COLORS = ['#0564A8', '#00ACEF', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats (handled by backend based on role)
                const resStats = await api.get('/api/dashboard/stats');
                setStats(resStats.data);

                // If not an Admin, we also fetch the projects list to display at the bottom
                if (!['Administrateur', 'Administrateur système'].includes(currentUser.fonction)) {
                    const resProjets = await api.get('/api/projets');
                    setProjets(Array.isArray(resProjets.data) ? resProjets.data : (resProjets.data.data || []));
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.fonction]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-gray-400">
                    <Activity size={32} className="animate-spin text-[#0564A8]" />
                    <p className="font-bold tracking-widest uppercase text-sm">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center text-red-500">Erreur de chargement.</div>;

    // Fonction de rendu de la liste des projets
    const renderProjectsList = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Mes Projets Récents</h3>
                <Link to="/projets" className="text-xs font-bold text-[#0564A8] hover:underline">Voir tout</Link>
            </div>
            {projets.length === 0 ? (
                <p className="p-8 text-center text-gray-400">Vous n'êtes encore impliqué dans aucun projet.</p>
            ) : (
                <div className="divide-y divide-gray-50">
                    {projets.slice(0, 5).map(p => (
                        <Link key={p.id} to={`/projets/${p.id}`} className="flex items-center gap-4 p-4 px-6 hover:bg-gray-50 transition">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{p.titre}</p>
                                <p className="text-xs text-gray-400 capitalize">{p.statut?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-24 bg-gray-100 rounded-full h-2 hidden sm:block">
                                    <div className="bg-[#0564A8] h-2 rounded-full transition-all" style={{width: `${p.avancement || 0}%`}}></div>
                                </div>
                                <span className="text-xs font-bold text-gray-600 w-8">{Math.round(p.avancement || 0)}%</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );

    // 1. Vue pour les Membres normaux (Pas de graphiques poussés)
    if (!stats.role_vue) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Tableau de Bord</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Vue d'ensemble de vos projets.</p>
                </div>
                {renderProjectsList()}
            </div>
        );
    }

    // 2. Vue pour l'Administrateur
    if (stats.role_vue === 'Administrateur') {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Administration Système</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Vue globale de l'état du système.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Utilisateurs</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.utilisateurs.total}</h3>
                            <p className="text-xs text-emerald-600 font-bold mt-2">{stats.utilisateurs.actifs} actifs, {stats.utilisateurs.inactifs} inactifs</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-[#0564A8]" /> Activité Récente (Audit)
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {stats.activite_recente.map((log) => (
                            <div key={log.id} className="p-4 px-6 hover:bg-gray-50 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0564A8] flex items-center justify-center text-xs font-bold shrink-0">
                                    {log.utilisateur?.prenom?.[0] || '?'}{log.utilisateur?.nom?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900">
                                        <span className="font-bold">{log.utilisateur?.prenom} {log.utilisateur?.nom}</span> a effectué une action : <span className="font-bold text-[#0564A8]">{log.action}</span> sur <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{log.modele}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(log.created_at).toLocaleString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Vue Superviseur / Chef de projet / Gestionnaire
    
    // --- Helpers pour le Donut des Statuts ---
    const STATUT_COLORS = {
        'A FAIRE': '#f59e0b',      // Orange
        'EN COURS': '#0564A8',     // Bleu
        'EN REVISION': '#8b5cf6',  // Violet
        'TERMINEE': '#10b981'      // Vert
    };
    
    const formatStatutName = (statut) => statut?.replace(/_/g, ' ').toUpperCase() || 'INCONNU';
    
    const tachesDonutData = stats.repartition_taches?.map(item => ({
        name: formatStatutName(item.statut),
        value: parseInt(item.total, 10),
        color: STATUT_COLORS[formatStatutName(item.statut)] || '#64748b'
    })) || [];

    // Jauges d'avancement des projets
    const CustomAvancementGauge = ({ projet }) => {
        const value = parseInt(projet.avancement, 10) || 0;
        const color = value === 100 ? '#10b981' : '#0564A8'; // Vert si fini, Bleu sinon
        const data = [{ name: 'A', value: value }, { name: 'B', value: 100 - value }];
        
        return (
            <div className="flex flex-col items-center justify-center gap-3 w-40">
                <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data} cx="50%" cy="50%"
                                innerRadius={32} outerRadius={42}
                                startAngle={90} endAngle={-270}
                                dataKey="value" stroke="none"
                            >
                                <Cell fill={color} />
                                <Cell fill="#f1f5f9" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-extrabold text-gray-900 text-lg">{value}%</span>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-gray-600 text-center leading-tight line-clamp-2 px-2 h-8">
                    {projet.titre}
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Tableau de bord</h1>
            </div>

            {/* LIGNE 1 : KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-[#0564A8] border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-[#0564A8] leading-none mb-1">{stats.kpis?.projets_geres}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Projets gérés</p>
                    </div>
                    <Folder size={28} className="text-[#0564A8] opacity-80" />
                </Link>
                <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-emerald-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-emerald-600 leading-none mb-1">{stats.kpis?.total_taches}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total des tâches</p>
                    </div>
                    <CheckSquare size={28} className="text-emerald-500 opacity-80" />
                </Link>
                <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-orange-400 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-orange-500 leading-none mb-1">{stats.kpis?.taches_en_cours}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tâches en cours</p>
                    </div>
                    <Settings size={28} className="text-orange-400 opacity-80" />
                </Link>
                <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-red-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-red-500 leading-none mb-1">{stats.kpis?.taches_en_retard}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tâches en retard</p>
                    </div>
                    <AlertTriangle size={28} className="text-red-500 opacity-80" />
                </Link>
                <Link to="/reunions" className="bg-white rounded-2xl p-5 border-l-4 border-purple-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-purple-600 leading-none mb-1">{stats.kpis?.reunions_a_venir}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Réunions à venir</p>
                    </div>
                    <Phone size={28} className="text-purple-500 opacity-80" />
                </Link>
                <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-rose-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition cursor-pointer">
                    <div>
                        <h3 className="text-3xl font-black text-rose-500 leading-none mb-1">{stats.kpis?.projets_a_risque}</h3>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Projets à risque</p>
                    </div>
                    <BellRing size={28} className="text-rose-500 opacity-80" />
                </Link>
            </div>

            {/* LIGNE 2 : Avancement + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Avancement des projets */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6">Avancement des projets</h3>
                    <div className="flex flex-wrap items-center justify-start gap-8 min-h-[160px]">
                        {stats.avancement_projets?.map(projet => (
                            <CustomAvancementGauge key={projet.id} projet={projet} />
                        ))}
                        {(!stats.avancement_projets || stats.avancement_projets.length === 0) && (
                            <p className="text-gray-400 text-sm w-full text-center">Aucun projet en cours.</p>
                        )}
                    </div>
                </div>

                {/* Actions requises & tâches critiques */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6">Actions requises & tâches critiques</h3>
                    
                    {/* Alerte demandes */}
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-center gap-3 mb-5">
                        <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-orange-700">
                            {stats.actions_requises?.demandes_changement} demande(s) de changement en attente.
                        </p>
                    </div>

                    {/* Liste Tâches critiques */}
                    <div className="space-y-3">
                        {stats.actions_requises?.taches_critiques?.map(tache => (
                            <div key={tache.id} className="bg-red-50/30 border border-red-50 rounded-xl p-3 flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-[13px] font-bold text-gray-800 leading-tight mb-0.5">{tache.titre}</p>
                                    {(tache.activite || tache.phase_titre) && (
                                        <p className="text-[10px] text-gray-400 mb-1 leading-tight">
                                            {tache.activite?.phase?.titre || tache.phase_titre || 'Sans phase'} 
                                            <span className="mx-1 text-gray-300">›</span> 
                                            {tache.activite?.titre || tache.activite_titre || 'Générale'}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                                        <span className="flex items-center gap-1"><User size={12}/> {tache.responsable?.prenom} {tache.responsable?.nom}</span>
                                        <span className="flex items-center gap-1"><Clock size={12}/> {tache.date_limite}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats.actions_requises?.taches_critiques || stats.actions_requises.taches_critiques.length === 0) && (
                            <p className="text-gray-400 text-xs italic text-center py-4">Aucune tâche critique.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* LIGNE 3 : Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tâches terminées par mois */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6">Tâches terminées par mois (6 derniers mois)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.taches_terminees_mois} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                {/* Label pour indiquer la valeur au dessus de chaque barre */}
                                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 4, 4]} barSize={40}>
                                    {/* Optional: Add LabelList here if you want numbers on top */}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Répartition par statut */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6">Répartition des tâches par statut</h3>
                    <div className="flex h-64 items-center">
                        <div className="w-1/2 h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tachesDonutData} cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={80}
                                        paddingAngle={2} dataKey="value" stroke="none"
                                    >
                                        {tachesDonutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-black text-3xl text-gray-900 leading-none">{stats.kpis?.total_taches}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">au total</span>
                            </div>
                        </div>
                        <div className="w-1/2 pl-4 flex flex-col justify-center gap-3">
                            {tachesDonutData.map(item => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{backgroundColor: item.color}}></div>
                                        <span className="text-[11px] font-bold text-gray-700 capitalize">{item.name.toLowerCase()}</span>
                                    </div>
                                    <div className="flex gap-2 text-[11px]">
                                        <span className="font-black text-gray-900">{item.value}</span>
                                        <span className="text-gray-400 font-medium">
                                            {stats.kpis?.total_taches > 0 ? Math.round((item.value / stats.kpis.total_taches) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Dashboard;
