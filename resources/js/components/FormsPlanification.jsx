import React, { useState } from 'react';
import api from '../axios';
import { AlertTriangle, Plus } from 'lucide-react';

export const ModalCreateActivite = ({ phases, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ id_phase: '', titre: '', description: '', date_debut: '', date_fin: '', priorite: 'moyenne' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/api/phases/${formData.id_phase}/activites`, formData);
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur création activité');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Nouvelle Activité</h3>
                <div className="space-y-3 mb-6">
                    <select required className="w-full border rounded-lg p-2 text-sm" value={formData.id_phase} onChange={e => setFormData({...formData, id_phase: e.target.value})}>
                        <option value="">Sélectionnez une phase...</option>
                        {phases.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                    <input type="text" placeholder="Titre de l'activité" required className="w-full border rounded-lg p-2 text-sm" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
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

export const ModalCreateTache = ({ phases, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ id_activite: '', titre: '', description: '', priorite: 'moyenne', date_limite: '' });
    const [loading, setLoading] = useState(false);

    // Extraction de toutes les activités depuis les phases
    const toutesActivites = phases.reduce((acc, p) => [...acc, ...(p.activites || [])], []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/api/taches`, formData);
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur création tâche');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Nouvelle Tâche</h3>
                <div className="space-y-3 mb-6">
                    <select required className="w-full border rounded-lg p-2 text-sm" value={formData.id_activite} onChange={e => setFormData({...formData, id_activite: e.target.value})}>
                        <option value="">Sélectionnez une activité parent...</option>
                        {toutesActivites.map(a => <option key={a.id} value={a.id}>{a.titre}</option>)}
                    </select>
                    <input type="text" placeholder="Titre de la tâche" required className="w-full border rounded-lg p-2 text-sm" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
                    <textarea placeholder="Description" className="w-full border rounded-lg p-2 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="flex gap-2">
                        <input type="date" required className="w-full border rounded-lg p-2 text-sm" value={formData.date_limite} onChange={e => setFormData({...formData, date_limite: e.target.value})} />
                        <select className="w-full border rounded-lg p-2 text-sm" value={formData.priorite} onChange={e => setFormData({...formData, priorite: e.target.value})}>
                            <option value="basse">Basse</option>
                            <option value="moyenne">Moyenne</option>
                            <option value="haute">Haute</option>
                            <option value="critique">Critique</option>
                        </select>
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
