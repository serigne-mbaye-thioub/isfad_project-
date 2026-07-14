import React, { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import api from '../axios';

const ModalInitierProjet = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        objectif: '',
        division: '',
        partenaire: '',
        date_debut: '',
        date_fin: '',
        priorite: 'moyenne'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/projets/initier', formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'initiation du projet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-extrabold text-gray-900">Initier le projet</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form id="initiationForm" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Titre du projet <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.titre}
                                onChange={e => setFormData({...formData, titre: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                placeholder="Ex: Extension du réseau fibre inter-sites"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description / Contexte <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                placeholder="Déploiement d'une liaison fibre optique..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Objectifs</label>
                            <textarea
                                rows="3"
                                value={formData.objectif}
                                onChange={e => setFormData({...formData, objectif: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                placeholder="Objectifs principaux du projet..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Division / Source <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.division}
                                    onChange={e => setFormData({...formData, division: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                    placeholder="Division ou structure émettrice"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Partenaire (optionnel)</label>
                                <input
                                    type="text"
                                    value={formData.partenaire}
                                    onChange={e => setFormData({...formData, partenaire: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                    placeholder="Partenaire externe si applicable"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date de début prévue <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date_debut}
                                    onChange={e => setFormData({...formData, date_debut: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date de fin prévue (optionnel)</label>
                                <input
                                    type="date"
                                    value={formData.date_fin}
                                    onChange={e => setFormData({...formData, date_fin: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Priorité <span className="text-red-500">*</span></label>
                            <div className="flex gap-3">
                                {['critique', 'haute', 'moyenne', 'basse'].map(p => (
                                    <label key={p} className={`flex-1 text-center py-2 px-3 rounded-lg border cursor-pointer transition-all ${formData.priorite === p ? 'border-[#0564A8] bg-blue-50 text-[#0564A8] font-bold ring-1 ring-[#0564A8]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                        <input type="radio" name="priorite" value={p} checked={formData.priorite === p} onChange={e => setFormData({...formData, priorite: e.target.value})} className="hidden" />
                                        <span className="text-xs capitalize">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </form>
                    
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                        <Lightbulb size={20} className="text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-[#0564A8] font-medium">Une fois initié, le projet pourra être transmis formellement au <strong>Chef de projet</strong>.</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        form="initiationForm"
                        disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-2 bg-[#0564A8] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#034f84] transition shadow-lg shadow-[#0564A8]/20 disabled:opacity-50"
                    >
                        {loading ? 'Initiation...' : '✓ Initier le projet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalInitierProjet;
