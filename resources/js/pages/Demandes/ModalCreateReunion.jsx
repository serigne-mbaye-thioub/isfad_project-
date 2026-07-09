import React, { useState } from 'react';
import api from '../../axios';
import { Calendar } from 'lucide-react';

const ModalCreateReunion = ({ onClose, onSuccess, utilisateurs, projets, isChef }) => {
    const [formData, setFormData] = useState({ 
        titre: '', ordre_du_jour: '', lieu: '', 
        date_reunion: '', duree_minutes: 60, id_projet: '', participants: [] 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/reunions', {
                ...formData,
                id_projet: formData.id_projet || null
            });
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de la création de la réunion');
        } finally {
            setLoading(false);
        }
    };

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(id) 
                ? prev.participants.filter(p => p !== id) 
                : [...prev.participants, id]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#0564A8]" /> {isChef ? 'Planifier une réunion' : 'Demander une réunion'}</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Objet</label>
                            <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Projet lié (Optionnel)</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={formData.id_projet} onChange={e => setFormData({...formData, id_projet: e.target.value})}>
                                <option value="">Aucun projet</option>
                                {projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Ordre du jour</label>
                        <textarea required rows="3" className="w-full border rounded-lg p-2 text-sm" value={formData.ordre_du_jour} onChange={e => setFormData({...formData, ordre_du_jour: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Date et Heure</label>
                            <input type="datetime-local" required className="w-full border rounded-lg p-2 text-sm" value={formData.date_reunion} onChange={e => setFormData({...formData, date_reunion: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Durée (minutes)</label>
                            <input type="number" required min="15" step="15" className="w-full border rounded-lg p-2 text-sm" value={formData.duree_minutes} onChange={e => setFormData({...formData, duree_minutes: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Lieu ou Lien Visio</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})} placeholder="Salle A ou Zoom" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">Sélectionner les participants</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2">
                            {utilisateurs.map(u => (
                                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input type="checkbox" checked={formData.participants.includes(u.id)} onChange={() => toggleParticipant(u.id)} className="rounded text-[#0564A8] focus:ring-[#0564A8]" />
                                    <span>{u.prenom} {u.nom}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold hover:bg-[#044c80] transition">
                        {isChef ? 'Planifier' : 'Demander'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModalCreateReunion;
