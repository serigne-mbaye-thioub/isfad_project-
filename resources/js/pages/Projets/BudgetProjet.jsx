import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { Wallet, Plus, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

const BudgetProjet = ({ projetId, currentUser }) => {
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInitModal, setShowInitModal] = useState(false);
    const [showDepenseModal, setShowDepenseModal] = useState(false);

    const [formInit, setFormInit] = useState({ montant_initial: '', devise: 'XOF' });
    const [formDepense, setFormDepense] = useState({ description: '', montant: '', date_depense: '', categorie: '' });

    const fetchBudget = async () => {
        try {
            const res = await api.get(`/api/projets/${projetId}/budget`);
            setBudgetData(res.data);
        } catch (e) {
            if (e.response?.status !== 404) {
                console.error(e);
            }
            setBudgetData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBudget(); }, [projetId]);

    const handleInitBudget = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/projets/${projetId}/budget`, formInit);
            setShowInitModal(false);
            fetchBudget();
        } catch (e) {
            alert('Erreur: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleAddDepense = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/budgets/${budgetData.budget.id}/depenses`, formDepense);
            setShowDepenseModal(false);
            setFormDepense({ description: '', montant: '', date_depense: '', categorie: '' });
            fetchBudget();
        } catch (e) {
            alert('Erreur: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleActionDepense = async (depenseId, statut) => {
        try {
            await api.patch(`/api/depenses/${depenseId}/valider`, { statut });
            fetchBudget();
        } catch (e) {
            alert('Erreur de validation');
        }
    };

    const isAdminOrChef = ['Administrateur', 'Administrateur système', 'Chef de projet', 'Gestionnaire de projet'].includes(currentUser?.fonction);

    if (loading) return <div className="p-4 text-gray-500 animate-pulse">Chargement du budget...</div>;

    if (!budgetData) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-10 text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun budget défini</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Ce projet n'a pas encore d'enveloppe budgétaire allouée. Initialisez le budget pour commencer le suivi.</p>
                {isAdminOrChef && (
                    <button onClick={() => setShowInitModal(true)} className="bg-[#0564A8] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200">
                        Initialiser le Budget
                    </button>
                )}

                {/* Modale d'initialisation */}
                {showInitModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleInitBudget} className="bg-white rounded-2xl p-6 w-full max-w-sm text-left">
                            <h3 className="font-bold text-lg mb-4">Allouer un budget</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Montant (XOF)</label>
                                    <input type="number" required min="1" className="w-full border rounded-lg p-2 text-sm" value={formInit.montant_initial} onChange={e => setFormInit({...formInit, montant_initial: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowInitModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    const { budget, statistiques: stats } = budgetData;

    return (
        <div className="space-y-6">
            {/* Cartes KPI Budget */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase">Enveloppe Globale</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{new Intl.NumberFormat('fr-FR').format(stats.total_alloue)} <span className="text-sm font-bold text-gray-400">{budget.devise}</span></h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-[#0564A8]">
                    <p className="text-xs font-bold text-gray-500 uppercase">Consommé (Validé)</p>
                    <h3 className="text-2xl font-black text-[#0564A8] mt-1">{new Intl.NumberFormat('fr-FR').format(stats.total_consomme)} <span className="text-sm font-bold text-[#0564A8]/60">{budget.devise}</span></h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-orange-400">
                    <p className="text-xs font-bold text-gray-500 uppercase">En attente de validation</p>
                    <h3 className="text-2xl font-black text-orange-500 mt-1">{new Intl.NumberFormat('fr-FR').format(stats.total_en_attente)} <span className="text-sm font-bold text-orange-300">{budget.devise}</span></h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Reste à dépenser</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">{new Intl.NumberFormat('fr-FR').format(stats.reste_a_depenser)} <span className="text-sm font-bold text-emerald-400">{budget.devise}</span></h3>
                </div>
            </div>

            {/* Jauge d'utilisation */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-700">Taux de consommation budgétaire</span>
                    <span className="text-xl font-black text-gray-900">{stats.pourcentage_consomme}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${stats.pourcentage_consomme > 90 ? 'bg-red-500' : 'bg-[#0564A8]'}`} style={{ width: `${Math.min(stats.pourcentage_consomme, 100)}%` }}></div>
                </div>
            </div>

            {/* Liste des Dépenses */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-extrabold text-gray-900">Registre des Dépenses</h3>
                    <button onClick={() => setShowDepenseModal(true)} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm transition">
                        <Plus size={16} /> Ajouter une dépense
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Montant</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {budget.depenses?.map(dep => (
                                <tr key={dep.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-500">{new Date(dep.date_depense).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{dep.description}</td>
                                    <td className="px-6 py-4 font-bold">{new Intl.NumberFormat('fr-FR').format(dep.montant)} {budget.devise}</td>
                                    <td className="px-6 py-4">
                                        {dep.statut === 'approuvee' && <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14}/> Approuvée</span>}
                                        {dep.statut === 'en_attente' && <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14}/> En attente</span>}
                                        {dep.statut === 'rejetee' && <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={14}/> Rejetée</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {dep.statut === 'en_attente' && isAdminOrChef && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleActionDepense(dep.id, 'approuvee')} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded" title="Approuver"><CheckCircle size={16}/></button>
                                                <button onClick={() => handleActionDepense(dep.id, 'rejetee')} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Rejeter"><XCircle size={16}/></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!budget.depenses?.length && (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Aucune dépense enregistrée.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modale Nouvelle Dépense */}
            {showDepenseModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAddDepense} className="bg-white rounded-2xl p-6 w-full max-w-md text-left">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wallet size={20} className="text-[#0564A8]"/> Saisir une dépense</h3>
                        
                        {/* Avertissement dépassement */}
                        {Number(formDepense.montant) > stats.reste_a_depenser && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold flex gap-2 items-start mb-4">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                Attention, ce montant dépasse le reste à dépenser alloué au projet !
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                                <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formDepense.description} onChange={e => setFormDepense({...formDepense, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Montant ({budget.devise})</label>
                                    <input type="number" required min="1" className="w-full border rounded-lg p-2 text-sm" value={formDepense.montant} onChange={e => setFormDepense({...formDepense, montant: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                                    <input type="date" required className="w-full border rounded-lg p-2 text-sm" value={formDepense.date_depense} onChange={e => setFormDepense({...formDepense, date_depense: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowDepenseModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">Soumettre</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BudgetProjet;
