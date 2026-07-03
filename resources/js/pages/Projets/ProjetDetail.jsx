import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../axios';
import { 
    FolderKanban, Users, Calendar, ArrowLeft, 
    MoreVertical, CheckCircle2, ChevronDown, Plus, LayoutDashboard
} from 'lucide-react';
import GestionEquipe from '../../components/GestionEquipe';
import KanbanBoard from '../../components/KanbanBoard';
import { ModalCreateActivite, ModalCreateTache } from '../../components/FormsPlanification';

const ModalCreatePhase = ({ projetId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ nom: '', description: '', date_debut: '', date_fin: '', ordre: 1 });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/api/projets/${projetId}/phases`, formData);
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur création phase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Nouvelle Phase</h3>
                <div className="space-y-3 mb-6">
                    <input type="text" placeholder="Nom de la phase" required className="w-full border rounded-lg p-2 text-sm" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                    <textarea placeholder="Description" className="w-full border rounded-lg p-2 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="flex gap-2">
                        <input type="date" required className="w-full border rounded-lg p-2 text-sm" value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})} />
                        <input type="date" required className="w-full border rounded-lg p-2 text-sm" value={formData.date_fin} onChange={e => setFormData({...formData, date_fin: e.target.value})} />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">Créer</button>
                </div>
            </form>
        </div>
    );
};

const ProjetDetail = () => {
    const { id } = useParams();
    const [projet, setProjet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'equipe'
    const [currentUser, setCurrentUser] = useState(null);
    const [showPhaseModal, setShowPhaseModal] = useState(false);
    const [showActiviteModal, setShowActiviteModal] = useState(false);
    const [showTacheModal, setShowTacheModal] = useState(false);

    const fetchProjet = async () => {
        try {
            const res = await api.get(`/api/projets/${id}`);
            setProjet(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('auth_user'));
        setCurrentUser(u);
        fetchProjet();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Chargement du projet...</div>;
    if (!projet) return <div className="p-8 text-center text-red-500">Projet introuvable.</div>;

    // Aplatir toutes les tâches pour le Kanban
    let toutesTaches = [...(projet.taches || [])];
    projet.phases?.forEach(p => {
        p.activites?.forEach(a => {
            toutesTaches = [...toutesTaches, ...(a.taches || [])];
        });
    });

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header Projet */}
            <div className="mb-6 flex-shrink-0">
                <Link to="/projets" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#0564A8] mb-4 font-medium transition">
                    <ArrowLeft size={14} /> Retour au portefeuille
                </Link>
                
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#0564A8]/10 text-[#0564A8] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {projet.statut.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
                                <Calendar size={14}/> {new Date(projet.date_debut).toLocaleDateString()} - {new Date(projet.date_fin).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{projet.titre}</h1>
                        <p className="text-gray-500 text-sm mt-1">{projet.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-[#0564A8]">{Math.round(projet.avancement)}%</span>
                        </div>
                        <div className="w-full md:w-48 bg-gray-100 rounded-full h-2">
                            <div className="bg-[#0564A8] h-2 rounded-full" style={{width: `${projet.avancement}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation des onglets */}
            <div className="flex gap-6 border-b border-gray-200 mb-6 flex-shrink-0 px-2">
                <button 
                    onClick={() => setActiveTab('kanban')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'kanban' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <LayoutDashboard size={16} /> Planification & Kanban
                </button>
                <button 
                    onClick={() => setActiveTab('equipe')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'equipe' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <Users size={16} /> Équipe du projet
                </button>
            </div>

            {/* Contenu de l'onglet */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'equipe' ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-y-auto">
                        <GestionEquipe projetId={projet.id} currentUserId={currentUser?.id} />
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h2 className="text-lg font-extrabold text-gray-900">Tableau de bord des tâches</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setShowPhaseModal(true)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-200 transition">
                                    <Plus size={14} /> Phase
                                </button>
                                <button onClick={() => setShowActiviteModal(true)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-200 transition">
                                    <Plus size={14} /> Activité
                                </button>
                                <button onClick={() => setShowTacheModal(true)} className="bg-[#0564A8] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#044c80] transition">
                                    <Plus size={14} /> Tâche
                                </button>
                            </div>
                        </div>
                        
                        {/* Zone Kanban défilable horizontalement */}
                        <div className="flex-1 overflow-hidden flex">
                            <KanbanBoard 
                                taches={toutesTaches} 
                                onTaskUpdate={fetchProjet} 
                                currentUser={currentUser} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {showPhaseModal && (
                <ModalCreatePhase projetId={projet.id} onClose={() => setShowPhaseModal(false)} onSuccess={() => {setShowPhaseModal(false); fetchProjet();}} />
            )}
            {showActiviteModal && (
                <ModalCreateActivite phases={projet.phases || []} onClose={() => setShowActiviteModal(false)} onSuccess={() => {setShowActiviteModal(false); fetchProjet();}} />
            )}
            {showTacheModal && (
                <ModalCreateTache phases={projet.phases || []} onClose={() => setShowTacheModal(false)} onSuccess={() => {setShowTacheModal(false); fetchProjet();}} />
            )}
        </div>
    );
};

export default ProjetDetail;
