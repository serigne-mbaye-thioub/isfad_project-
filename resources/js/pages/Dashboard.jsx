import React, { useEffect, useState } from 'react';
import api from '../axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Users, FolderKanban, AlertTriangle, TrendingUp, Wallet, Clock, Activity, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

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
                    setProjets(resProjets.data);
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
    const isSuperviseur = stats.role_vue === 'Superviseur';
    
    const formatChartData = (dataArray) => {
        if (!dataArray) return [];
        return dataArray.map(item => ({
            name: item.statut?.replace(/_/g, ' ').toUpperCase() || item.etat_spse?.toUpperCase() || 'INCONNU',
            value: parseInt(item.total, 10)
        }));
    };

    const projetsData = formatChartData(stats.projets.par_statut);
    const tachesData = formatChartData(stats.taches.par_statut);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord Décisionnel</h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                    Vue globale du portefeuille de projets.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Projets</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.projets.total}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> Avancement : {stats.projets.avancement_moyen}%
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0564A8] flex items-center justify-center">
                        <FolderKanban size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tâches en retard</p>
                        <h3 className="text-3xl font-black text-red-500">{stats.taches.en_retard}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-2">Nécessite votre attention</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                </div>

                {isSuperviseur && stats.finances && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Budget Consommé</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                {new Intl.NumberFormat('fr-FR', { notation: "compact", maximumFractionDigits: 1 }).format(stats.finances.consomme)}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium mt-2">
                                sur {new Intl.NumberFormat('fr-FR', { notation: "compact", maximumFractionDigits: 1 }).format(stats.finances.alloue)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                    </div>
                )}
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider">Répartition des Projets (Statut)</h3>
                    <div className="h-72">
                        {projetsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={projetsData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {projetsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider">Volume de Tâches</h3>
                    <div className="h-72">
                        {tachesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tachesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#0564A8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible.</div>
                        )}
                    </div>
                </div>
            </div>

            {renderProjectsList()}
        </div>
    );
};

export default Dashboard;
