import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import { 
    FolderKanban, Plus, Search, Calendar, ChevronRight, 
    MoreVertical, Activity, AlertTriangle, PlayCircle, CheckCircle2 
} from 'lucide-react';

const StatutBadge = ({ statut }) => {
    const statuts = {
        'a_demarrer': { label: 'À démarrer', color: 'bg-gray-100 text-gray-700 border-gray-200' },
        'en_cours':   { label: 'En cours',   color: 'bg-blue-50 text-[#0564A8] border-blue-200' },
        'suspendu':   { label: 'Suspendu',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
        'cloture':    { label: 'Clôturé',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'annule':     { label: 'Annulé',     color: 'bg-red-50 text-red-700 border-red-200' },
        'archive':    { label: 'Archivé',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const s = statuts[statut] || statuts['a_demarrer'];
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${s.color}`}>
            {s.label}
        </span>
    );
};

const PrioriteBadge = ({ priorite }) => {
    const priorites = {
        'basse':    { label: 'Basse',    icon: <ChevronRight size={14} className="text-gray-400 rotate-90" /> },
        'moyenne':  { label: 'Moyenne',  icon: <Activity size={14} className="text-blue-500" /> },
        'haute':    { label: 'Haute',    icon: <AlertTriangle size={14} className="text-orange-500" /> },
        'critique': { label: 'Critique', icon: <AlertTriangle size={14} className="text-red-500 fill-red-100" /> },
    };
    const p = priorites[priorite] || priorites['moyenne'];
    return (
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600" title={`Priorité: ${p.label}`}>
            {p.icon}
            <span className="hidden sm:inline">{p.label}</span>
        </div>
    );
};

const ProjetCard = ({ projet, onClick }) => {
    // Calcul de la barre de progression
    const avancement = parseFloat(projet.avancement) || 0;
    
    // Détermination de la couleur de la barre en fonction de l'avancement et du statut
    let progressColor = 'bg-[#0564A8]';
    if (projet.statut === 'cloture') progressColor = 'bg-emerald-500';
    if (projet.statut === 'suspendu') progressColor = 'bg-amber-500';

    return (
        <div 
            onClick={() => onClick(projet.id)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer group flex flex-col"
        >
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <StatutBadge statut={projet.statut} />
                    <button className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); /* Actions: Editer, Archiver */ }}>
                        <MoreVertical size={16} />
                    </button>
                </div>
                
                <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-[#0564A8] transition-colors line-clamp-2">
                    {projet.titre}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                    {projet.description || <span className="italic opacity-50">Aucune description</span>}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#0564A8]" />
                        {new Date(projet.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} 
                        <ChevronRight size={12} className="text-gray-300" /> 
                        {new Date(projet.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                    <PrioriteBadge priorite={projet.priorite} />
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                    {projet.membres?.slice(0, 4).map((membre, idx) => (
                        <div key={idx} className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-[9px] font-bold text-[#0564A8]" title={`${membre.prenom} ${membre.nom}`}>
                            {membre.prenom[0]}{membre.nom[0]}
                        </div>
                    ))}
                    {projet.membres?.length > 4 && (
                        <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">
                            +{projet.membres.length - 4}
                        </div>
                    )}
                    {!projet.membres?.length && (
                        <span className="text-xs text-gray-400 italic">Équipe vide</span>
                    )}
                </div>

                <div className="w-1/2 flex items-center gap-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`${progressColor} h-1.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${avancement}%` }}></div>
                    </div>
                    <span className="text-xs font-extrabold text-gray-700 min-w-[32px] text-right">
                        {Math.round(avancement)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Modale de création de projet ─────────────────────────────────────────────
const ModalCreateProjet = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        titre: '', description: '', date_debut: '', date_fin: '', priorite: 'moyenne'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/api/projets', formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0564A8] to-[#043d7a] px-8 py-6 text-white relative">
                    <h3 className="text-xl font-extrabold flex items-center gap-2 relative z-10">
                        <FolderKanban size={24} /> Nouveau Projet
                    </h3>
                    <p className="text-blue-100 text-sm mt-1 opacity-90 relative z-10">Initialisez un nouveau cadre logique et opérationnel.</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex gap-2 items-center">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    <div className="space-y-5 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Titre du projet <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all font-medium text-gray-900"
                                placeholder="ex: Déploiement de la plateforme e-learning" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Description (Objectifs)</label>
                            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm resize-none"
                                placeholder="Objectifs principaux, contexte, livrables attendus..." />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Date de début <span className="text-red-500">*</span></label>
                                <input type="date" required value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Date de fin prévue <span className="text-red-500">*</span></label>
                                <input type="date" required value={formData.date_fin} onChange={e => setFormData({...formData, date_fin: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm font-medium" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Priorité stratégique</label>
                            <div className="flex gap-4">
                                {['basse', 'moyenne', 'haute', 'critique'].map(p => (
                                    <label key={p} className={`flex-1 cursor-pointer border rounded-xl p-3 text-center transition-all ${formData.priorite === p ? 'border-[#0564A8] bg-blue-50 ring-2 ring-[#0564A8]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="priorite" value={p} checked={formData.priorite === p} onChange={() => setFormData({...formData, priorite: p})} className="sr-only" />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${formData.priorite === p ? 'text-[#0564A8]' : 'text-gray-500'}`}>{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-[2] py-3.5 rounded-xl bg-[#0564A8] hover:bg-[#2897E8] text-white text-sm font-bold transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-60">
                            {loading ? 'Création...' : 'Créer le projet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Composant Principal ─────────────────────────────────────────────────────
const ListeProjets = () => {
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();

    const fetchProjets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/projets');
            setProjets(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjets(); }, []);

    const filteredProjets = projets.filter(p => 
        p.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portefeuille Projets</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Gérez et suivez l'avancement de vos projets opérationnels.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] shadow-sm transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#0564A8] hover:bg-[#044c80] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all flex-shrink-0"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Nouveau projet</span>
                    </button>
                </div>
            </div>

            {/* Grille de projets */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-64 animate-pulse">
                            <div className="w-20 h-5 bg-gray-200 rounded-full mb-6"></div>
                            <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
                            <div className="w-full h-16 bg-gray-100 rounded-lg mb-6"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProjets.length === 0 ? (
                <div className="bg-white border border-gray-200 border-dashed rounded-3xl py-20 px-8 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-5">
                        <FolderKanban size={40} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Aucun projet trouvé</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Vous n'avez pas encore de projet ou aucun projet ne correspond à votre recherche. Initialisez un nouveau projet pour commencer.
                    </p>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#0564A8] hover:bg-[#044c80] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        <Plus size={18} /> Initialiser un projet
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjets.map(projet => (
                        <ProjetCard 
                            key={projet.id} 
                            projet={projet} 
                            onClick={(id) => navigate(`/projets/${id}`)} 
                        />
                    ))}
                </div>
            )}

            {showCreateModal && (
                <ModalCreateProjet 
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchProjets();
                    }}
                />
            )}
        </div>
    );
};

export default ListeProjets;
