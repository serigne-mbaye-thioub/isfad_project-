import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { Calendar, CheckCircle, Plus, Settings2, Clock, XCircle, GitPullRequest } from 'lucide-react';
import ModalCreateChangement from './ModalCreateChangement';
import ModalDecisionChangement from './ModalDecisionChangement';

const Demandes = () => {
    const [demandesChangement, setDemandesChangement] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModalChangement, setShowModalChangement] = useState(false);
    const [decisionDemande, setDecisionDemande] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const canOrganize = !['Administrateur', 'Administrateur système'].includes(currentUser?.fonction);

    const fetchData = async () => {
        try {
            const [resChangements, resProjets] = await Promise.all([
                api.get('/api/demandes-changements'),
                api.get('/api/projets')
            ]);
            setDemandesChangement(Array.isArray(resChangements.data) ? resChangements.data : (resChangements.data.data || []));
            setProjets(Array.isArray(resProjets.data) ? resProjets.data : (resProjets.data.data || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatutChangement = async (statut, commentaire) => {
        if (!decisionDemande) return;
        try {
            await api.patch(`/api/demandes-changements/${decisionDemande.id}/statut`, { 
                statut, 
                commentaire_decision: commentaire 
            });
            fetchData();
            setDecisionDemande(null);
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de la mise à jour de la demande');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Chargement des demandes...</div>;

    const totalChangements = demandesChangement.length;

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Demandes de Changement</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">
                        {totalChangements} demande(s) enregistrée(s)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canOrganize && (
                        <button onClick={() => setShowModalChangement(true)} className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#044c80] transition">
                            <Plus size={16} /> Demander un changement
                        </button>
                    )}
                </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div className="space-y-4">
                    {demandesChangement.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            Aucune demande de changement en cours.
                        </div>
                    ) : (
                        demandesChangement.map(d => (
                            <div key={d.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col transition hover:border-[#0564A8]/30">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2 items-center">
                                        {d.statut === 'en_attente' && <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-orange-200 flex items-center gap-1"><Clock size={12}/> En attente</span>}
                                        {d.statut === 'acceptee' && <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1"><CheckCircle size={12}/> Acceptée</span>}
                                        {d.statut === 'refusee' && <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200 flex items-center gap-1"><XCircle size={12}/> Refusée</span>}
                                        {d.statut === 'annulee' && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200 flex items-center gap-1"><XCircle size={12}/> Annulée</span>}
                                        
                                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider truncate">
                                            Cible: {d.nom_cible}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-1">{d.titre}</h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    Demandé par <span className="font-bold text-gray-600">{d.demandeur?.prenom} {d.demandeur?.nom}</span> ({d.demandeur?.fonction})
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{d.description}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Justification</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{d.justification || 'Non renseignée'}</p>
                                    </div>
                                </div>

                                {d.commentaire_decision && (
                                    <div className={`mb-4 p-3 rounded-xl border ${d.statut === 'refusee' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${d.statut === 'refusee' ? 'text-red-500' : 'text-emerald-600'}`}>
                                            Décision du Gestionnaire
                                        </p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{d.commentaire_decision}</p>
                                    </div>
                                )}

                                {/* Actions d'approbation (uniquement si autorisé et si statut non final) */}
                                {d.can_validate && d.statut !== 'acceptee' && d.statut !== 'refusee' && d.statut !== 'annulee' && (
                                    <div className="flex justify-end items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
                                        <button onClick={() => setDecisionDemande({id: d.id, statut: 'refusee'})} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                                            Rejeter
                                        </button>
                                        <button onClick={() => setDecisionDemande({id: d.id, statut: 'acceptee'})} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition shadow-sm">
                                            Approuver
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modales */}
            {showModalChangement && <ModalCreateChangement onClose={() => setShowModalChangement(false)} onSuccess={() => {setShowModalChangement(false); fetchData();}} projets={projets} />}
            {decisionDemande && (
                <ModalDecisionChangement 
                    statut={decisionDemande.statut}
                    onClose={() => setDecisionDemande(null)}
                    onConfirm={handleStatutChangement}
                />
            )}
        </div>
    );
};

export default Demandes;
