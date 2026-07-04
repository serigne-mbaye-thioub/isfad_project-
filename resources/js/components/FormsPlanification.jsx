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

export const ModalCreateTache = ({ phases, projetId, membres = [], onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        id_activite: '',
        titre: '',
        description: '',
        priorite: 'moyenne',
        date_limite: '',
        id_responsable: '',
        id_approbateur: '',
        consultes: [],
        informes: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Extraction de toutes les activités depuis les phases
    const toutesActivites = phases.reduce((acc, p) => [...acc, ...(p.activites || [])], []);

    const handleCheckboxChange = (type, id) => {
        if (type === 'consultes') {
            const newConsultes = formData.consultes.includes(id)
                ? formData.consultes.filter(item => item !== id)
                : [...formData.consultes, id];
            setFormData({ ...formData, consultes: newConsultes });
        } else if (type === 'informes') {
            const newInformes = formData.informes.includes(id)
                ? formData.informes.filter(item => item !== id)
                : [...formData.informes, id];
            setFormData({ ...formData, informes: newInformes });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                titre:       formData.titre,
                description: formData.description,
                priorite:    formData.priorite,
                date_limite: formData.date_limite,
                id_responsable: formData.id_responsable || null,
                id_approbateur: formData.id_approbateur || null,
                consultes: formData.consultes,
                informes: formData.informes,
            };

            // Rattachement : activité en priorité, sinon le projet directement
            if (formData.id_activite) {
                payload.id_activite = formData.id_activite;
            } else if (projetId) {
                payload.id_projet = projetId;
            }

            await api.post(`/api/taches`, payload);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur lors de la création de la tâche');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 shrink-0">
                    <Plus size={20} className="text-[#0564A8]" /> Nouvelle Tâche
                </h3>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    {/* Activité parente (optionnelle si projet direct) */}
                    {toutesActivites.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                Activité parente <span className="font-normal text-gray-400">(optionnel)</span>
                            </label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm"
                                value={formData.id_activite}
                                onChange={e => setFormData({...formData, id_activite: e.target.value})}
                            >
                                <option value="">— Tâche directe du projet —</option>
                                {toutesActivites.map(a => <option key={a.id} value={a.id}>{a.titre}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Titre <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Ex: Rédiger le rapport d'étape"
                            required
                            className="w-full border rounded-lg p-2 text-sm"
                            value={formData.titre}
                            onChange={e => setFormData({...formData, titre: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                        <textarea
                            placeholder="Détails de la tâche..."
                            rows={2}
                            className="w-full border rounded-lg p-2 text-sm resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Date limite <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                required
                                className="w-full border rounded-lg p-2 text-sm"
                                value={formData.date_limite}
                                onChange={e => setFormData({...formData, date_limite: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Priorité</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm"
                                value={formData.priorite}
                                onChange={e => setFormData({...formData, priorite: e.target.value})}
                            >
                                <option value="basse">Basse</option>
                                <option value="moyenne">Moyenne</option>
                                <option value="haute">Haute</option>
                                <option value="critique">Critique</option>
                            </select>
                        </div>
                    </div>

                    {/* Matrice RACI */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                        <h4 className="font-bold text-sm text-gray-700 mb-3 border-b pb-2">Matrice RACI</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Responsable (R) <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 text-sm"
                                    value={formData.id_responsable}
                                    onChange={e => setFormData({...formData, id_responsable: e.target.value})}
                                >
                                    <option value="">Sélectionnez un responsable...</option>
                                    {membres.map(m => (
                                        <option key={`r-${m.id || m.participation_id}`} value={m.utilisateur?.id || m.id_utilisateur}>
                                            {m.utilisateur?.prenom} {m.utilisateur?.nom} ({m.role_projet})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Approbateur (A)</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm"
                                    value={formData.id_approbateur}
                                    onChange={e => setFormData({...formData, id_approbateur: e.target.value})}
                                >
                                    <option value="">Aucun approbateur...</option>
                                    {membres.map(m => (
                                        <option key={`a-${m.id || m.participation_id}`} value={m.utilisateur?.id || m.id_utilisateur}>
                                            {m.utilisateur?.prenom} {m.utilisateur?.nom} ({m.role_projet})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Consultés (C)</label>
                                <div className="h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white p-2 space-y-1">
                                    {membres.length === 0 && <p className="text-xs text-gray-400 italic">Aucun membre disponible</p>}
                                    {membres.map(m => {
                                        const userId = String(m.utilisateur?.id || m.id_utilisateur);
                                        return (
                                            <label key={`c-${m.id || m.participation_id}`} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.consultes.includes(userId)}
                                                    onChange={() => handleCheckboxChange('consultes', userId)}
                                                    className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]"
                                                />
                                                <span className="text-xs font-medium text-gray-700">{m.utilisateur?.prenom} {m.utilisateur?.nom}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Informés (I)</label>
                                <div className="h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white p-2 space-y-1">
                                    {membres.length === 0 && <p className="text-xs text-gray-400 italic">Aucun membre disponible</p>}
                                    {membres.map(m => {
                                        const userId = String(m.utilisateur?.id || m.id_utilisateur);
                                        return (
                                            <label key={`i-${m.id || m.participation_id}`} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.informes.includes(userId)}
                                                    onChange={() => handleCheckboxChange('informes', userId)}
                                                    className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]"
                                                />
                                                <span className="text-xs font-medium text-gray-700">{m.utilisateur?.prenom} {m.utilisateur?.nom}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold hover:bg-[#044c80] transition">
                        {loading ? 'Création...' : 'Créer la tâche'}
                    </button>
                </div>
            </form>
        </div>
    );
};
