import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { GitPullRequest, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';

const DemandesChangement = ({ projetId, currentUser }) => {
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({ titre: '', description: '', impact_delai_jours: '', impact_budget: '', priorite: 'moyenne' });

    const fetchDemandes = async () => {
        try {
            const res = await api.get(`/api/demandes-changements?projet_id=${projetId}`);
            setDemandes(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDemandes(); }, [projetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/demandes-changements', { ...formData, type_cible: 'projet', id_cible: projetId });
            setShowModal(false);
            setFormData({ titre: '', description: '', impact_delai_jours: '', impact_budget: '', priorite: 'moyenne' });
            fetchDemandes();
        } catch (e) {
            alert('Erreur: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleAction = async (id, statut) => {
        try {
            await api.patch(`/api/demandes-changements/${id}/statut`, { statut });
            fetchDemandes();
        } catch (e) {
            alert('Erreur de validation');
        }
    };

    const isAdminOrChef = currentUser?.fonction === 'Administrateur' || currentUser?.fonction === 'Chef de projet';

    if (loading) return <div className="p-4 text-gray-500 animate-pulse">Chargement des demandes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <GitPullRequest className="text-[#0564A8]" /> Demandes de Changement
                </h2>
                <button onClick={() => setShowModal(true)} className="bg-[#0564A8] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 shadow-lg shadow-blue-200 transition">
                    <Plus size={16} /> Nouvelle Demande
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {demandes.map(dem => (
                    <div key={dem.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    dem.statut === 'approuvee' ? 'bg-emerald-50 text-emerald-600' :
                                    dem.statut === 'rejetee' ? 'bg-red-50 text-red-600' :
                                    dem.statut === 'appliquee' ? 'bg-gray-100 text-gray-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                    {dem.statut.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    dem.priorite === 'critique' ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-500'
                                }`}>
                                    Priorité {dem.priorite}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    Soumis par {dem.demandeur?.prenom} {dem.demandeur?.nom} le {new Date(dem.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-base font-extrabold text-gray-900 mb-1">{dem.titre}</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dem.description}</p>
                            
                            {(dem.impact_delai_jours || dem.impact_budget) && (
                                <div className="mt-4 flex gap-4 text-xs font-bold text-gray-500">
                                    {dem.impact_delai_jours && <span>Impact délai : +{dem.impact_delai_jours} jours</span>}
                                    {dem.impact_budget && <span>Impact budget : +{new Intl.NumberFormat('fr-FR').format(dem.impact_budget)} XOF</span>}
                                </div>
                            )}
                        </div>

                        {dem.statut === 'soumise' && isAdminOrChef && (
                            <div className="flex flex-col gap-2 w-full md:w-32 shrink-0 border-l border-gray-100 md:pl-4">
                                <button onClick={() => handleAction(dem.id, 'en_analyse')} className="text-xs font-bold py-1.5 px-3 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">Mettre à l'étude</button>
                                <button onClick={() => handleAction(dem.id, 'approuvee')} className="text-xs font-bold py-1.5 px-3 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">Approuver</button>
                                <button onClick={() => handleAction(dem.id, 'rejetee')} className="text-xs font-bold py-1.5 px-3 rounded bg-red-50 text-red-600 hover:bg-red-100">Rejeter</button>
                            </div>
                        )}
                        {dem.statut === 'en_analyse' && isAdminOrChef && (
                            <div className="flex flex-col gap-2 w-full md:w-32 shrink-0 border-l border-gray-100 md:pl-4">
                                <button onClick={() => handleAction(dem.id, 'approuvee')} className="text-xs font-bold py-1.5 px-3 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">Approuver</button>
                                <button onClick={() => handleAction(dem.id, 'rejetee')} className="text-xs font-bold py-1.5 px-3 rounded bg-red-50 text-red-600 hover:bg-red-100">Rejeter</button>
                            </div>
                        )}
                        {dem.statut === 'approuvee' && isAdminOrChef && (
                            <div className="flex flex-col gap-2 w-full md:w-32 shrink-0 border-l border-gray-100 md:pl-4">
                                <button onClick={() => handleAction(dem.id, 'appliquee')} className="text-xs font-bold py-1.5 px-3 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Clôturer (Appliqué)</button>
                            </div>
                        )}
                    </div>
                ))}

                {demandes.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        Aucune demande de changement pour ce projet.
                    </div>
                )}
            </div>

            {/* Modale */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md text-left">
                        <h3 className="font-bold text-lg mb-4">Nouvelle demande de changement</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Titre</label>
                                <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Description détaillée</label>
                                <textarea required rows="3" className="w-full border rounded-lg p-2 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Impact (jours)</label>
                                    <input type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.impact_delai_jours} onChange={e => setFormData({...formData, impact_delai_jours: e.target.value})} placeholder="Ex: 5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Impact (Coût)</label>
                                    <input type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.impact_budget} onChange={e => setFormData({...formData, impact_budget: e.target.value})} placeholder="Ex: 500000" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">Soumettre</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default DemandesChangement;
