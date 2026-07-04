import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../axios';
import { 
    FolderKanban, Users, Calendar, ArrowLeft, 
    MoreVertical, CheckCircle2, ChevronDown, Plus, LayoutDashboard, Wallet, GitPullRequest
} from 'lucide-react';
import GestionEquipe from '../../components/GestionEquipe';
import KanbanBoard from '../../components/KanbanBoard';
import { ModalCreateActivite, ModalCreateTache } from '../../components/FormsPlanification';
import BudgetProjet from './BudgetProjet';
import DemandesChangement from './DemandesChangement';

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
                        
                        {!projet.transmis_gestionnaire && currentUser?.fonction === 'Chef de projet' && (
                            <div className="mt-4">
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Voulez-vous transmettre ce projet au gestionnaire ?')) {
                                            api.post(`/api/projets/${projet.id}/transmettre`)
                                               .then(() => window.location.reload())
                                               .catch(e => alert(e.response?.data?.message || 'Erreur lors de la transmission'));
                                        }
                                    }}
                                    className="text-xs bg-blue-50 text-[#0564A8] px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition border border-blue-200"
                                >
                                    Transmettre au Gestionnaire
                                </button>
                            </div>
                        )}
                        {!projet.transmis_gestionnaire && currentUser?.fonction === 'Architecte' && (
                            <div className="mt-4 inline-block text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg border border-yellow-200 font-semibold">
                                En attente de transmission par le Chef de projet
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                        {currentUser?.fonction === 'Superviseur' && projet.statut !== 'annule' && (
                            <button 
                                onClick={() => {
                                    if(window.confirm('Voulez-vous vraiment annuler ce projet ?')) {
                                        api.put(`/api/projets/${projet.id}`, { statut: 'annule' })
                                           .then(() => window.location.reload())
                                           .catch(e => alert('Erreur lors de l\'annulation'));
                                    }
                                }}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition"
                            >
                                Annuler le projet
                            </button>
                        )}
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
            <div className="flex gap-6 border-b border-gray-200 mb-6 flex-shrink-0 px-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('fiche')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'fiche' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <FolderKanban size={16} /> Fiche Projet
                </button>
                <button 
                    onClick={() => setActiveTab('kanban')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'kanban' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <CheckCircle2 size={16} /> Tâches
                </button>
                <button 
                    onClick={() => setActiveTab('equipe')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'equipe' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <Users size={16} /> Équipe du projet
                </button>
                <button 
                    onClick={() => setActiveTab('budget')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'budget' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <Wallet size={16} /> Budget & Dépenses
                </button>
                <button 
                    onClick={() => setActiveTab('demandes')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'demandes' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <GitPullRequest size={16} /> Demandes de Changement
                </button>
            </div>

            {/* Contenu de l'onglet */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'fiche' ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Fiche de Projet</h2>
                        {projet.fiche_projet ? (
                            <div className="prose prose-sm text-gray-700 max-w-none whitespace-pre-wrap mb-6">
                                {projet.fiche_projet}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic mb-6">Aucune description textuelle fournie.</p>
                        )}

                        {projet.fiche_fichier && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Document Joint</h3>
                                <a href={`/storage/${projet.fiche_fichier}`} target="_blank" rel="noreferrer"
                                   className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-[#0564A8] transition">
                                    Voir le document joint
                                </a>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'equipe' ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-y-auto">
                        <GestionEquipe projetId={projet.id} currentUser={currentUser} />
                    </div>
                ) : activeTab === 'budget' ? (
                    <div className="overflow-y-auto h-full">
                        <BudgetProjet projetId={projet.id} currentUser={currentUser} />
                    </div>
                ) : activeTab === 'demandes' ? (
                    <div className="overflow-y-auto h-full">
                        <DemandesChangement projetId={projet.id} currentUser={currentUser} />
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
                <ModalCreateTache phases={projet.phases || []} projetId={projet.id} membres={projet.membres || []} onClose={() => setShowTacheModal(false)} onSuccess={() => {setShowTacheModal(false); fetchProjet();}} />
            )}
        </div>
    );
};

export default ProjetDetail;
