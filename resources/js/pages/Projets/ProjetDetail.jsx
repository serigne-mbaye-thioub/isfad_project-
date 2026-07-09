import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../axios';
import { 
    FolderKanban, Users, Calendar, ArrowLeft, 
    MoreVertical, CheckCircle2, ChevronDown, Plus, LayoutDashboard, Wallet, GitPullRequest, Filter, FileText
} from 'lucide-react';
import GestionEquipe from '../../components/GestionEquipe';
import KanbanBoard from '../../components/KanbanBoard';
import { ModalCreateActivite, ModalCreateTache } from '../../components/FormsPlanification';
import ModalConfirm from '../../components/ModalConfirm';
import BudgetProjet from './BudgetProjet';
import DemandesChangement from './DemandesChangement';
import RapportsProjet from './RapportsProjet';

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
                    <select required className="w-full border rounded-lg p-2 text-sm" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}>
                        <option value="">Sélectionnez une phase...</option>
                        <option value="initialisation">Initialisation</option>
                        <option value="planification">Planification</option>
                        <option value="execution">Exécution</option>
                        <option value="suivi">Suivi et contrôle</option>
                        <option value="cloture">Clôture</option>
                    </select>
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
    const [filterResponsable, setFilterResponsable] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ isOpen: false });

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

    let toutesTaches = [...(projet.taches || [])];
    projet.phases?.forEach(p => {
        p.activites?.forEach(a => {
            const tachesEnrichies = (a.taches || []).map(t => ({
                ...t, 
                phase_titre: p.nom, 
                activite_titre: a.titre
            }));
            toutesTaches = [...toutesTaches, ...tachesEnrichies];
        });
    });

    const tachesFiltrees = toutesTaches.filter(t => {
        if (filterResponsable === 'all') return true;
        if (filterResponsable === 'me') return t.id_responsable === currentUser?.id;
        return t.id_responsable === parseInt(filterResponsable, 10);
    });
    const activeFilterText = filterResponsable === 'all' 
        ? 'Toutes les tâches' 
        : filterResponsable === 'me' 
            ? 'Mes tâches'
            : (projet?.membres?.find(m => m.id == filterResponsable)?.prenom || '') + ' ' + (projet?.membres?.find(m => m.id == filterResponsable)?.nom || '');

    const canFilterTasks = ['Chef de projet', 'Gestionnaire de projet', 'Gestionnaire', 'Administrateur', 'Administrateur système'].includes(currentUser?.fonction);
    const isGlobalManager = ['Gestionnaire de projet', 'Gestionnaire', 'Administrateur', 'Administrateur système'].includes(currentUser?.fonction);

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
                                    onClick={() => setConfirmAction({
                                        isOpen: true,
                                        title: 'Transmettre au gestionnaire',
                                        message: 'Êtes-vous sûr de vouloir transmettre ce projet au gestionnaire ? Une fois transmis, il pourra être validé et démarrer.',
                                        type: 'primary',
                                        onConfirm: () => {
                                            api.post(`/api/projets/${projet.id}/transmettre`)
                                               .then(() => window.location.reload())
                                               .catch(e => alert(e.response?.data?.message || 'Erreur lors de la transmission'));
                                        }
                                    })}
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Statut</span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-extrabold capitalize border border-emerald-100">
                                {projet.statut.replace(/_/g, ' ')}
                            </span>
                        </div>
                        {projet.statut !== 'annule' && currentUser?.fonction === 'Chef de projet' && (
                            <button 
                                onClick={() => setConfirmAction({
                                    isOpen: true,
                                    title: 'Annuler le projet',
                                    message: 'Êtes-vous sûr de vouloir annuler ce projet ? Cette action modifiera son statut en "Annulé".',
                                    type: 'danger',
                                    onConfirm: async () => {
                                        await api.put(`/api/projets/${projet.id}`, { statut: 'annule' });
                                        fetchProjet();
                                    }
                                })}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition"
                            >
                                Annuler le projet
                            </button>
                        )}
                        {isGlobalManager && projet.statut !== 'a_demarrer' && projet.statut !== 'initie' && (
                            <button 
                                onClick={() => setConfirmAction({
                                    isOpen: true,
                                    title: projet.statut === 'archive' ? 'Désarchiver le projet' : 'Archiver le projet',
                                    message: projet.statut === 'archive' 
                                        ? 'Êtes-vous sûr de vouloir désarchiver ce projet ? Il redeviendra visible pour les autres membres.' 
                                        : 'Êtes-vous sûr de vouloir archiver ce projet ? Seul le Gestionnaire y aura accès.',
                                    type: projet.statut === 'archive' ? 'primary' : 'danger',
                                    onConfirm: async () => {
                                        await api.patch(`/api/projets/${projet.id}/archiver`);
                                        fetchProjet();
                                    }
                                })}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${projet.statut === 'archive' ? 'bg-blue-50 text-[#0564A8] hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {projet.statut === 'archive' ? 'Désarchiver le projet' : 'Archiver le projet'}
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
                <button 
                    onClick={() => setActiveTab('rapports')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'rapports' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                    <FileText size={16} /> Rapports
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
                ) : activeTab === 'rapports' ? (
                    <div className="overflow-y-auto h-full">
                        <RapportsProjet projetId={projet.id} currentUser={currentUser} />
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-extrabold text-gray-900">Tableau de bord des tâches</h2>
                                {canFilterTasks && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Filter size={14} className="text-[#0564A8]" />
                                            <span className="truncate max-w-[150px]">{activeFilterText}</span>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isFilterOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2">
                                                    <div className="px-4 pb-2 mb-2 border-b border-gray-50">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtres rapides</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {setFilterResponsable('all'); setIsFilterOpen(false);}} 
                                                        className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${filterResponsable === 'all' ? 'text-[#0564A8] bg-blue-50/50' : 'text-gray-700 hover:bg-gray-50'}`}
                                                    >
                                                        Toutes les tâches
                                                        {filterResponsable === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-[#0564A8]"></div>}
                                                    </button>
                                                    <button 
                                                        onClick={() => {setFilterResponsable('me'); setIsFilterOpen(false);}} 
                                                        className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${filterResponsable === 'me' ? 'text-[#0564A8] bg-blue-50/50' : 'text-gray-700 hover:bg-gray-50'}`}
                                                    >
                                                        Mes tâches
                                                        {filterResponsable === 'me' && <div className="w-1.5 h-1.5 rounded-full bg-[#0564A8]"></div>}
                                                    </button>
                                                    
                                                    <div className="px-4 pt-3 pb-2 mt-2 border-t border-gray-50 mb-1">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Par membre</p>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {projet.membres?.filter(m => m.id !== currentUser?.id).map(m => (
                                                            <button 
                                                                key={m.id}
                                                                onClick={() => {setFilterResponsable(m.id.toString()); setIsFilterOpen(false);}} 
                                                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${filterResponsable === m.id.toString() ? 'text-[#0564A8] bg-blue-50/50 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                                                            >
                                                                {m.prenom} {m.nom}
                                                                {filterResponsable === m.id.toString() && <div className="w-1.5 h-1.5 rounded-full bg-[#0564A8]"></div>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                taches={tachesFiltrees} 
                                onTaskUpdate={fetchProjet} 
                                currentUser={currentUser} 
                                membres={projet.membres}
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

            <ModalConfirm 
                {...confirmAction} 
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })} 
            />
        </div>
    );
};

export default ProjetDetail;
