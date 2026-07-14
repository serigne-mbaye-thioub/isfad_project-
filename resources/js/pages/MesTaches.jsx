import React, { useState, useEffect } from 'react';
import { ListTodo, Search, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../axios';
import ModalDetailTache from '../components/ModalDetailTache';
import ModalAlert from '../components/ModalAlert';
import { Link, useSearchParams } from 'react-router-dom';

const PRIORITE_MAP = {
    'basse': 'bg-gray-100 text-gray-700',
    'moyenne': 'bg-gray-100 text-gray-700',
    'haute': 'bg-orange-100 text-orange-700',
    'critique': 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
    { id: 'a_faire', label: 'À faire', color: 'text-gray-700 bg-gray-100' },
    { id: 'en_cours', label: 'En cours', color: 'text-[#0564A8] bg-blue-100' },
    { id: 'en_revision', label: 'En révision', color: 'text-orange-700 bg-orange-100' },
    { id: 'terminee', label: 'Terminée', color: 'text-emerald-700 bg-emerald-100' }
];

const MesTaches = () => {
    const [taches, setTaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const fetchTaches = async () => {
        try {
            const res = await api.get('/api/mes-taches');
            setTaches(res.data);
            // La logique d'ouverture de tâche est déplacée dans un useEffect dédié
        } catch (e) {
            console.error("Erreur lors de la récupération des tâches", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('auth_user'));
        setCurrentUser(u);
        fetchTaches();
    }, []);

    // Surveiller les paramètres d'URL pour ouvrir la modale si on clique sur une notification
    useEffect(() => {
        const tacheIdParam = searchParams.get('tache_id');
        if (tacheIdParam && taches.length > 0) {
            const tacheToOpen = taches.find(t => t.id === parseInt(tacheIdParam));
            if (tacheToOpen) {
                setSelectedTask(tacheToOpen);
            }
        }
    }, [searchParams, taches]);

    const [alertMessage, setAlertMessage] = useState('');

    const handleStatusChange = async (taskId, newStatut) => {
        try {
            await api.patch(`/api/taches/${taskId}/statut`, { statut: newStatut });
            setTaches(taches.map(t => t.id === taskId ? { ...t, statut: newStatut } : t));
        } catch (e) {
            setAlertMessage(e.response?.data?.message || 'Erreur lors du changement de statut');
        }
    };

    const filteredTaches = taches.filter(t => {
        const matchTitre = t.titre?.toLowerCase().includes(search.toLowerCase());
        const projetTitre = t.projet?.titre || t.activite?.projet?.titre || '';
        const matchProjet = projetTitre.toLowerCase().includes(search.toLowerCase());
        return matchTitre || matchProjet;
    });

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col p-6">
            <ModalAlert 
                isOpen={!!alertMessage}
                title="Accès refusé"
                message={alertMessage}
                onClose={() => setAlertMessage('')}
            />
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <ListTodo className="text-[#0564A8]" /> Mes Tâches
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Retrouvez ici toutes les tâches qui vous sont assignées à travers vos différents projets.
                    </p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher une tâche..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tâche & Projet</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-32">Priorité</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-40">Date limite</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-48">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-16 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 animate-pulse">
                                        Chargement de vos tâches...
                                    </td>
                                </tr>
                            ) : filteredTaches.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 mb-3">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="text-gray-900 font-bold">Aucune tâche à faire !</p>
                                        <p className="text-gray-500 text-sm mt-1">Vous êtes à jour dans tous vos projets.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTaches.map(tache => {
                                    const isRetard = new Date() > new Date(tache.date_limite) && !['terminee', 'archivee'].includes(tache.statut);
                                    
                                    const phase = tache.activite?.phase?.titre || tache.activite?.phase?.nom;
                                    const jalon = tache.activite?.jalon?.titre;
                                    const activite = tache.activite?.titre;
                                    const projetTitre = tache.projet?.titre || tache.activite?.projet?.titre || 'Projet inconnu';
                                    const projetId = tache.id_projet || tache.activite?.id_projet;

                                    return (
                                        <tr key={tache.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-bold text-gray-900">{tache.titre}</h3>
                                                        {tache.id_approbateur === currentUser?.id && tache.id_responsable !== currentUser?.id && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100" title="Vous devez approuver cette tâche">
                                                                À APPROUVER
                                                            </span>
                                                        )}
                                                        {tache.id_responsable === currentUser?.id && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0564A8] border border-blue-100" title="Vous êtes responsable de cette tâche">
                                                                RESPONSABLE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                                        {projetId ? (
                                                            <Link to={`/projets/${projetId}`} className="text-[#0564A8] hover:underline flex items-center gap-1">
                                                                {projetTitre}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-[#0564A8] flex items-center gap-1">{projetTitre}</span>
                                                        )}
                                                        
                                                        {(phase || jalon || activite) && (
                                                            <>
                                                                <span className="text-gray-300 mx-1">|</span>
                                                                {phase && (
                                                                    <><span>{phase}</span><span className="text-gray-300">›</span></>
                                                                )}
                                                                {jalon && (
                                                                    <><span className="text-purple-600 font-semibold">{jalon}</span><span className="text-gray-300">›</span></>
                                                                )}
                                                                {activite && (
                                                                    <span>{activite}</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${PRIORITE_MAP[tache.priorite] || PRIORITE_MAP['moyenne']}`}>
                                                    {tache.priorite}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${isRetard ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {isRetard ? <AlertCircle size={14} /> : <Clock size={14} />}
                                                    {new Date(tache.date_limite).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={tache.statut}
                                                    onChange={(e) => handleStatusChange(tache.id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-[#0564A8]/30 cursor-pointer w-full ${STATUS_OPTIONS.find(s => s.id === tache.statut)?.color}`}
                                                >
                                                    {STATUS_OPTIONS.map(status => (
                                                        <option key={status.id} value={status.id}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedTask(tache)}
                                                    className="p-1.5 text-gray-400 hover:text-[#0564A8] hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                                                    title="Voir les détails"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTask && (
                <ModalDetailTache 
                    task={selectedTask} 
                    currentUser={currentUser}
                    onClose={() => {
                        setSelectedTask(null);
                        // Nettoyer l'URL
                        if (searchParams.get('tache_id')) {
                            searchParams.delete('tache_id');
                            setSearchParams(searchParams);
                        }
                    }}
                    onTaskUpdate={() => {
                        fetchTaches();
                    }}
                />
            )}
        </div>
    );
};

export default MesTaches;
