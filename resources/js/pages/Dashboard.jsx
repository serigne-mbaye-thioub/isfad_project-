import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Users, FolderKanban, AlertTriangle, TrendingUp, Wallet, Clock, Activity, Target,
    Folder, CheckSquare, Settings, Phone, BellRing, User, AlertCircle,
    Calendar, CheckCircle2, Briefcase, BarChart2, PieChart as PieChartIcon
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

    // Jauge d'avancement réutilisable
    const CustomAvancementGauge = ({ projet }) => {
        const value = parseInt(projet.avancement, 10) || 0;
        const color = value === 100 ? '#10b981' : '#0564A8'; // Vert si fini, Bleu sinon
        const data = [{ name: 'A', value: value }, { name: 'B', value: 100 - value }];
        
        return (
            <Link to={`/projets/${projet.id}`} className="flex flex-col items-center justify-center gap-3 w-40 hover:scale-105 transition-transform cursor-pointer group">
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
                        <span className="font-extrabold text-gray-900 text-lg group-hover:text-[#0564A8] transition-colors">{value}%</span>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-gray-600 text-center leading-tight line-clamp-2 px-2 h-8 group-hover:text-[#0564A8] transition-colors">
                    {projet.titre}
                </p>
            </Link>
        );
    };

    // 1. Vue pour les Membres normaux
    if (stats.role_vue === 'Membre') {
        return (
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Mon Espace de Travail</h1>
                </div>

                {/* LIGNE 1 : KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-[#0564A8] border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition">
                        <div>
                            <h3 className="text-3xl font-black text-[#0564A8] leading-none mb-1">{stats.kpis?.projets_actifs}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Projets Actifs</p>
                        </div>
                        <FolderKanban size={28} className="text-[#0564A8] opacity-80" />
                    </Link>
                    <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-emerald-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition">
                        <div>
                            <h3 className="text-3xl font-black text-emerald-600 leading-none mb-1">{stats.kpis?.taches_terminees}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tâches Finies</p>
                        </div>
                        <CheckSquare size={28} className="text-emerald-500 opacity-80" />
                    </Link>
                    <Link to="/projets" className="bg-white rounded-2xl p-5 border-l-4 border-orange-400 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition">
                        <div>
                            <h3 className="text-3xl font-black text-orange-500 leading-none mb-1">{stats.kpis?.taches_en_cours + stats.kpis?.taches_a_faire}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tâches Restantes</p>
                        </div>
                        <Settings size={28} className="text-orange-400 opacity-80" />
                    </Link>
                    <Link to="/calendrier" className="bg-white rounded-2xl p-5 border-l-4 border-purple-500 border-y border-r border-gray-100 shadow-sm flex items-center justify-between hover:scale-105 hover:shadow-md transition">
                        <div>
                            <h3 className="text-3xl font-black text-purple-600 leading-none mb-1">{stats.kpis?.reunions_a_venir}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Réunions à venir</p>
                        </div>
                        <Phone size={28} className="text-purple-500 opacity-80" />
                    </Link>
                </div>

                {/* LIGNE 2 : Tâches et Avancement */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Tâches Urgentes */}
                    <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-extrabold text-gray-900">Mes Tâches Prioritaires</h3>
                            <Link to="/projets" className="text-xs font-bold text-[#0564A8] hover:underline">Voir tout</Link>
                        </div>
                        <div className="space-y-3 flex-1">
                            {stats.taches_urgentes?.map(tache => (
                                <Link key={tache.id} to={`/projets`} className="block bg-gray-50 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-100 rounded-xl p-4 transition-all">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{tache.titre}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${new Date(tache.date_limite) < new Date() ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                                            {new Date(tache.date_limite) < new Date() ? 'En retard' : 'À faire'}
                                        </span>
                                    </div>
                                    {(tache.activite || tache.phase_titre) && (
                                        <p className="text-[10px] text-gray-400 mb-2 leading-tight">
                                            {tache.activite?.phase?.titre || tache.phase_titre || 'Sans phase'} 
                                            <span className="mx-1 text-gray-300">›</span> 
                                            {tache.activite?.titre || tache.activite_titre || 'Générale'}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                                        <Clock size={12}/> {new Date(tache.date_limite).toLocaleDateString('fr-FR')}
                                    </div>
                                </Link>
                            ))}
                            {(!stats.taches_urgentes || stats.taches_urgentes.length === 0) && (
                                <p className="text-gray-400 text-sm text-center py-4">Aucune tâche en attente.</p>
                            )}
                        </div>
                    </div>

                    {/* Avancement Projets */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-extrabold text-gray-900">Avancement de mes projets</h3>
                            <Link to="/projets" className="text-xs font-bold text-[#0564A8] hover:underline">Liste complète</Link>
                        </div>
                        <div className="flex flex-wrap items-center justify-start gap-8 flex-1">
                            {stats.avancement_projets?.map(projet => (
                                <CustomAvancementGauge key={projet.id} projet={projet} />
                            ))}
                            {(!stats.avancement_projets || stats.avancement_projets.length === 0) && (
                                <p className="text-gray-400 text-sm w-full text-center">Vous n'êtes assigné à aucun projet en cours.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* LIGNE 3 : Réunions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-extrabold text-gray-900">Mon Agenda (Réunions à venir)</h3>
                        <Link to="/calendrier" className="text-xs font-bold text-[#0564A8] hover:underline">Accéder au calendrier</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.reunions_a_venir_list?.map(reunion => (
                            <div key={reunion.id} className="bg-purple-50/30 border border-purple-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition cursor-default">
                                <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold uppercase">{new Date(reunion.date_reunion).toLocaleDateString('fr-FR', {month: 'short'})}</span>
                                    <span className="text-lg font-black leading-none">{new Date(reunion.date_reunion).getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-0.5 line-clamp-1">{reunion.titre}</p>
                                    <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1"><Clock size={12}/> {new Date(reunion.date_reunion).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} ({reunion.duree_minutes} min)</p>
                                    {reunion.projet && <p className="text-[10px] font-bold text-purple-600 bg-purple-100 inline-block px-2 py-0.5 rounded-full">{reunion.projet.titre}</p>}
                                </div>
                            </div>
                        ))}
                        {(!stats.reunions_a_venir_list || stats.reunions_a_venir_list.length === 0) && (
                            <p className="text-gray-400 text-sm text-center py-4 col-span-full">Aucune réunion prévue prochainement.</p>
                        )}
                    </div>
                </div>

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
    
    const totalDonut = stats.kpis?.total_taches || 0;

    // CustomAvancementGauge déplacé plus haut

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

            {/* LIGNE 2 : 3 Blocs importants (Avancement, Statuts, Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Avancement des projets */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative">
                    <Link to="/projets/avancement" className="flex items-center justify-between group mb-6 cursor-pointer">
                        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 group-hover:text-[#0564A8] transition-colors">
                            <FolderKanban size={18} className="text-[#0564A8]" />
                            Avancement des projets
                        </h3>
                        {stats.avancement_projets?.length > 2 && (
                            <span className="text-xs font-bold text-[#0564A8] opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-1 rounded-md">Voir tout ({stats.avancement_projets.length}) →</span>
                        )}
                    </Link>
                    <div className="flex-1 flex flex-row flex-wrap justify-center items-center gap-6 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.avancement_projets?.slice(0, 2).map(projet => (
                            <CustomAvancementGauge key={projet.id} projet={projet} />
                        ))}
                        {(!stats.avancement_projets || stats.avancement_projets.length === 0) && (
                            <p className="text-gray-400 text-sm w-full text-center py-8">Aucun projet en cours.</p>
                        )}
                        {stats.avancement_projets?.length > 2 && (
                            <div className="w-full mt-auto pt-4 border-t border-gray-50 flex justify-center">
                                <Link to="/projets/avancement" className="text-xs font-bold text-gray-400 hover:text-[#0564A8] transition-colors flex items-center gap-1">
                                    +{stats.avancement_projets.length - 2} autres projets en cours
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Répartition par statut (Déplacé ici) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-emerald-600" />
                        Répartition par statut
                    </h3>
                    <div className="flex flex-col flex-1 pb-4 items-center justify-center">
                        <div className="w-full h-40 relative mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tachesDonutData} cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={65}
                                        paddingAngle={4} dataKey="value" stroke="none"
                                    >
                                        {tachesDonutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-gray-900 leading-none">{totalDonut}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tâches</span>
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-2 px-2">
                            {tachesDonutData.map((d, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[11px] font-bold text-gray-700">{d.name}</span>
                                            <span className="text-[11px] font-black text-gray-900">{d.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: d.color, width: `${totalDonut > 0 ? (d.value / totalDonut) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions requises & tâches critiques */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        Actions & Alertes
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Alerte demandes */}
                        {stats.actions_requises?.demandes_changement > 0 && (
                            <Link to="/demandes" className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 flex items-start gap-3 mb-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group">
                                <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-orange-800 group-hover:text-orange-900">Demandes en attente</p>
                                    <p className="text-[11px] font-medium text-orange-600 mt-0.5">
                                        {stats.actions_requises.demandes_changement} demande(s) de changement à traiter.
                                    </p>
                                </div>
                                <span className="text-orange-400 group-hover:text-orange-600 transition-colors text-xs font-bold mt-0.5">Voir →</span>
                            </Link>
                        )}

                        {/* Liste Tâches critiques */}
                        <div className="space-y-3">
                            {stats.actions_requises?.taches_critiques?.map(tache => (
                                <div key={tache.id} className="bg-red-50/40 border border-red-100 rounded-xl p-3 flex gap-3 shadow-sm hover:shadow transition-shadow group relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                    <div className="pl-1 w-full">
                                        <p className="text-[12px] font-bold text-gray-900 leading-tight mb-1">{tache.titre}</p>
                                        {(tache.activite || tache.phase_titre) && (
                                            <p className="text-[10px] text-gray-500 mb-2 leading-tight truncate">
                                                {tache.activite?.phase?.titre || tache.phase_titre || 'Sans phase'} 
                                                <span className="mx-1 text-gray-300">›</span> 
                                                {tache.activite?.titre || tache.activite_titre || 'Générale'}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-[10px] font-medium mt-2">
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md text-gray-600 border border-gray-100 shadow-sm"><User size={10} className="text-gray-400"/> {tache.responsable?.prenom} {tache.responsable?.nom}</span>
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md text-red-600"><Clock size={10}/> {tache.date_limite}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!stats.actions_requises?.taches_critiques || stats.actions_requises.taches_critiques.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                                    <p className="text-gray-500 text-xs font-bold">Aucune tâche critique</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* LIGNE 3 : Ma Journée & Graphique Tâches terminées */}
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6">
                
                {/* Ma Journée */}
                <div className="bg-white rounded-2xl p-0 border border-gray-100 shadow-sm flex flex-col h-[350px] overflow-hidden lg:col-span-1">
                    <div className="bg-gradient-to-r from-[#0564A8] to-blue-600 p-5 text-white">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-extrabold flex items-center gap-2">
                                <Calendar size={16} className="text-blue-100" />
                                Ma Journée
                            </h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <p className="text-xs text-blue-100 font-medium opacity-90">Vos activités prévues aujourd'hui</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
                        {(!stats.sa_journee?.reunions?.length && !stats.sa_journee?.taches?.length) ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={28} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">Journée dégagée !</p>
                                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Aucune tâche à rendre ou réunion planifiée aujourd'hui.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {stats.sa_journee?.reunions?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Réunions ({stats.sa_journee.reunions.length})</p>
                                        </div>
                                        <div className="space-y-3">
                                            {stats.sa_journee.reunions.map(r => (
                                                <Link to="/calendrier" key={r.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-indigo-50 flex flex-col justify-center items-center min-w-[50px]">
                                                        <span className="text-xs font-black text-indigo-700">{r.date_reunion?.substring(11, 16)}</span>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                                        <p className="text-[13px] font-bold text-gray-800 leading-tight mb-1 truncate">{r.titre}</p>
                                                        <p className="text-[10px] font-semibold text-indigo-600 truncate flex items-center gap-1">
                                                            <Briefcase size={10} /> {r.projet?.titre || 'Générale'}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {stats.sa_journee?.taches?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tâches à clôturer ({stats.sa_journee.taches.length})</p>
                                        </div>
                                        <div className="space-y-3">
                                            {stats.sa_journee.taches.map(t => {
                                                const isOverdue = t.date_limite && new Date(t.date_limite.substring(0, 10)) < new Date(new Date().setHours(0,0,0,0));
                                                
                                                return (
                                                <Link to={t.id_projet ? `/projets/${t.id_projet}` : '#'} key={t.id} className={`bg-white border ${isOverdue ? 'border-red-200 bg-red-50/30 hover:border-red-300' : 'border-gray-100 hover:border-gray-300'} rounded-xl p-3 flex items-center gap-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md cursor-pointer transition-all relative overflow-hidden group`}>
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOverdue ? 'bg-red-600' : (t.priorite === 'critique' ? 'bg-red-500' : t.priorite === 'haute' ? 'bg-orange-500' : 'bg-[#0564A8]')}`}></div>
                                                    
                                                    <div className={`w-6 h-6 rounded-full ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border flex items-center justify-center flex-shrink-0 ml-1`}>
                                                        {isOverdue ? (
                                                            <AlertCircle size={12} className="text-red-600" />
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.priorite === 'critique' ? '#ef4444' : t.priorite === 'haute' ? '#f97316' : '#0564A8' }}></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[12px] font-bold leading-snug truncate ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>{t.titre}</p>
                                                        <div className="flex items-center justify-between mt-0.5">
                                                            <p className="text-[10px] font-medium text-gray-500 truncate flex items-center gap-1">
                                                                <FolderKanban size={10} /> {t.projet?.titre || 'Sans projet'}
                                                            </p>
                                                            {isOverdue && (
                                                                <span className="bg-red-100 text-red-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm flex items-center gap-1 animate-pulse">
                                                                    EN RETARD
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tâches terminées par mois */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-[350px]">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart2 size={18} className="text-teal-600" />
                        Tâches terminées par mois (6 derniers mois)
                    </h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.taches_terminees_mois} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                <RechartsTooltip 
                                    cursor={{fill: '#f8fafc'}} 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                                />
                                <Bar dataKey="count" name="Tâches" fill="#0d9488" radius={[6, 6, 6, 6]} barSize={45}>
                                    {stats.taches_terminees_mois?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === stats.taches_terminees_mois.length - 1 ? '#0f766e' : '#2dd4bf'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Dashboard;
