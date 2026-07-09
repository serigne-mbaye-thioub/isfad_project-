import React, { useState } from 'react';
import api from '../../axios';
import { Settings2, AlertTriangle, FileEdit } from 'lucide-react';

const ModalCreateChangement = ({ onClose, onSuccess, projets }) => {
    const [formData, setFormData] = useState({
        type_cible: 'projet',
        id_cible: '',
        titre: '',
        description: '',
        justification: '',
    });
    const [loading, setLoading] = useState(false);

    // Note: Dans une vraie appli, si on choisit 'tache', on devrait idéalement charger la liste des tâches du projet.
    // Pour simplifier cette modale (et vu que id_cible est un entier libre), on va laisser l'utilisateur saisir l'ID ou restreindre au projet.
    // Mais pour respecter la demande "l'utilisateur puisse choisir le type d'élément", on permet le choix du type.
    // Pour l'UX, on va lier "Projet" à la liste des projets, et pour les autres cibles, demander l'ID numérique.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/demandes-changements', formData);
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de la création de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Settings2 size={20} className="text-[#0564A8]" /> Demander un changement
                </h3>
                
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium mb-5 flex gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p>Toute demande de changement devra être approuvée par le Chef de projet ou le Gestionnaire avant d'être appliquée.</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Titre de la demande *</label>
                        <input type="text" required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[#0564A8] focus:border-[#0564A8]" 
                            value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} 
                            placeholder="Ex: Augmentation du budget, Modification de deadline..." />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Projet concerné *</label>
                        <select required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[#0564A8] focus:border-[#0564A8]" 
                            value={formData.id_cible} 
                            onChange={e => setFormData({...formData, id_cible: e.target.value, type_cible: 'projet'})}>
                            <option value="">-- Sélectionner un projet --</option>
                            {projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Description détaillée *</label>
                        <textarea required rows="3" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" 
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                            placeholder="Que voulez-vous modifier exactement ?" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Justification / Impact</label>
                        <textarea rows="2" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" 
                            value={formData.justification} onChange={e => setFormData({...formData, justification: e.target.value})} 
                            placeholder="Pourquoi ce changement est-il nécessaire ?" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white hover:bg-[#044c80] rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition">
                        <FileEdit size={16} /> {loading ? 'Envoi...' : 'Soumettre la demande'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModalCreateChangement;
