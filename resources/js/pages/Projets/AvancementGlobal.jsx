import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderKanban, ArrowLeft, Clock, Calendar, CheckCircle } from 'lucide-react';
import api from '../../axios';

const CustomAvancementGauge = ({ projet }) => {
    const value = parseInt(projet.avancement, 10) || 0;
    const color = value === 100 ? '#10b981' : '#0564A8'; // Vert si fini, Bleu sinon
    const data = [{ name: 'A', value: value }, { name: 'B', value: 100 - value }];
    
    return (
        <div className="flex flex-col items-center justify-center gap-2 w-32">
            <div className="w-20 h-20 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data} cx="50%" cy="50%"
                            innerRadius={25} outerRadius={35}
                            startAngle={90} endAngle={-270}
                            dataKey="value" stroke="none"
                        >
                            <Cell fill={color} />
                            <Cell fill="#f1f5f9" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-extrabold text-gray-900 text-sm group-hover:text-[#0564A8] transition-colors">{value}%</span>
                </div>
            </div>
        </div>
    );
};

const getStatusBadge = (statut) => {
    switch (statut) {
        case 'nouveau':
            return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Nouveau</span>;
        case 'en_cours':
            return <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">En cours</span>;
        case 'en_pause':
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">En pause</span>;
        case 'cloture':
            return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Clôturé</span>;
        case 'annule':
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Annulé</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">{statut}</span>;
    }
};

const AvancementGlobal = () => {
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjets = async () => {
            try {
                // Fetch tous les projets auxquels l'utilisateur a accès
                const res = await api.get('/api/projets');
                // Filtrer les projets annulés ou archivés si nécessaire, 
                // mais ici on affiche l'ensemble des projets comme demandé
                const activeProjets = res.data.filter(p => p.statut !== 'archive');
                setProjets(activeProjets);
            } catch (error) {
                console.error("Erreur lors de la récupération des projets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjets();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0564A8]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vue Globale des Avancements</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 ml-11">Consultez la progression et les détails de l'ensemble de vos projets en cours.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projets.map((projet) => (
                    <Link 
                        key={projet.id} 
                        to={`/projets/${projet.id}`}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0564A8] flex items-center justify-center flex-shrink-0">
                                <FolderKanban size={20} />
                            </div>
                            {getStatusBadge(projet.statut)}
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 min-h-[40px] group-hover:text-[#0564A8] transition-colors">
                            {projet.titre}
                        </h3>
                        
                        <p className="text-xs text-gray-500 mb-6 line-clamp-2 min-h-[32px]">
                            {projet.description || "Aucune description fournie pour ce projet."}
                        </p>

                        <div className="mt-auto flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <Calendar size={12} /> {projet.date_debut ? new Date(projet.date_debut).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <Clock size={12} className={projet.statut === 'en_retard' ? 'text-red-500' : ''} /> {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                            <CustomAvancementGauge projet={projet} />
                        </div>
                    </Link>
                ))}

                {projets.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100">
                        <FolderKanban size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun projet trouvé</h3>
                        <p className="text-gray-500">Vous n'avez actuellement aucun projet en cours.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvancementGlobal;
