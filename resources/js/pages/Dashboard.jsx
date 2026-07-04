import React, { useEffect, useState } from 'react';
import api from '../axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Users, FolderKanban, AlertTriangle, TrendingUp, Wallet, Clock, Activity } from 'lucide-react';

const COLORS = ['#0564A8', '#00ACEF', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isAdmin = ['Administrateur', 'Administrateur système'].includes(currentUser?.fonction);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isAdmin) {
                    // Admin : stats globales
                    const res = await api.get('/api/admin/dashboard/stats');
                    setStats(res.data);
                } else {
                    // Autres rôles : leurs projets uniquement
                    const res = await api.get('/api/projets');
                    setProjets(res.data);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

    if (!isAdmin && !loading) {
        // Vue simplifiée pour les membres / chefs de projet
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Tableau de Bord</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Vos projets et activités en cours.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mes Projets</p>
                        <h3 className="text-3xl font-black text-gray-900">{projets.length}</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">En cours</p>
                        <h3 className="text-3xl font-black text-[#0564A8]">{projets.filter(p => p.statut === 'en_cours').length}</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Terminés</p>
                        <h3 className="text-3xl font-black text-emerald-600">{projets.filter(p => p.statut === 'cloture').length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Mes Projets récents</h3>
                    </div>
                    {projets.length === 0 ? (
                        <p className="p-8 text-center text-gray-400">Vous n'êtes encore membre d'aucun projet.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {projets.slice(0, 5).map(p => (
                                <a key={p.id} href={`/projets/${p.id}`} className="flex items-center gap-4 p-4 px-6 hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">{p.titre}</p>
                                        <p className="text-xs text-gray-400 capitalize">{p.statut?.replace('_',' ')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-100 rounded-full h-2">
                                            <div className="bg-[#0564A8] h-2 rounded-full" style={{width: `${p.avancement || 0}%`}}></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">{Math.round(p.avancement || 0)}%</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center text-red-500">Erreur de chargement.</div>;

    // Formatage des données pour Recharts
    const projetsData = stats.projets.par_statut.map(item => ({
        name: item.statut.replace('_', ' ').toUpperCase(),
        value: item.total
    }));

    const tachesData = stats.taches.par_statut.map(item => ({
        name: item.statut.replace('_', ' ').toUpperCase(),
        value: item.total
    }));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Vue d'ensemble des indicateurs de la gouvernance ISFAD.</p>
                </div>
            </div>

            {/* Top Cards (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Projets */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Projets</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.projets.par_statut.reduce((acc, curr) => acc + curr.total, 0)}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> Avancement moyen : {stats.projets.avancement_moyen}%
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0564A8] flex items-center justify-center">
                        <FolderKanban size={24} />
                    </div>
                </div>

                {/* Tâches en retard */}
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

                {/* Utilisateurs */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Utilisateurs</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.utilisateurs.total}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2">{stats.utilisateurs.actifs} actifs</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                </div>

                {/* Budget Global */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Budget Consommé</p>
                        <h3 className="text-2xl font-black text-gray-900">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(stats.finances.consomme)}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-2">
                            sur {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(stats.finances.alloue)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                        <Wallet size={24} />
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique Projets */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider">Répartition des Projets par Statut</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projetsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projetsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graphique Tâches */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider">Volume de Tâches</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={tachesData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                barSize={40}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <RechartsTooltip
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#0564A8" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-[#0564A8]" /> Activité Récente (Audit)
                    </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                    {stats.activite_recente.map((log) => (
                        <div key={log.id} className="p-4 px-6 hover:bg-gray-50 transition-colors flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0564A8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {log.utilisateur?.prenom?.[0] || '?'}{log.utilisateur?.nom?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">
                                    <span className="font-bold">{log.utilisateur?.prenom} {log.utilisateur?.nom}</span> a effectué une action de type <span className="font-bold text-[#0564A8]">{log.action}</span> sur <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{log.modele}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(log.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} — IP: {log.adresse_ip}
                                </p>
                            </div>
                        </div>
                    ))}
                    {stats.activite_recente.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">Aucune activité récente enregistrée.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
