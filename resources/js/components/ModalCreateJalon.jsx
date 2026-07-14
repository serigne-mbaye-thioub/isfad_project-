import React, { useState } from 'react';
import { X, Calendar, Type, AlignLeft } from 'lucide-react';
import api from '../axios';

const ModalCreateJalon = ({ onClose, onCreated, phases = [], projetId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        echeance: '',
        id_phase: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.id_phase) {
                delete dataToSubmit.id_phase;
            }
            const response = await api.post(`/api/projets/${projetId}/jalons`, dataToSubmit);
            onCreated(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création du jalon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Nouveau Jalon</h2>
                        <p className="text-sm text-gray-500 mt-1">Créer un événement clé pour ce projet.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                            <div className="mt-0.5">⚠️</div>
                            <div>{error}</div>
                        </div>
                    )}

                    <form id="createJalonForm" onSubmit={handleSubmit} className="space-y-5">
                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Titre du jalon <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Type size={16} />
                                </div>
                                <input
                                    type="text"
                                    name="titre"
                                    required
                                    value={formData.titre}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="Ex: Validation de l'architecture"
                                />
                            </div>
                        </div>

                        {/* Phase Optionnelle */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Rattacher à une phase (Optionnel)</label>
                            <select
                                name="id_phase"
                                value={formData.id_phase}
                                onChange={handleChange}
                                className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            >
                                <option value="">-- Aucun rattachement (Jalon de projet) --</option>
                                {phases.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Si vous ne sélectionnez rien, ce jalon sera rattaché au projet entier.</p>
                        </div>

                        {/* Échéance */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Date d'échéance <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar size={16} />
                                </div>
                                <input
                                    type="date"
                                    name="echeance"
                                    required
                                    value={formData.echeance}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description (Optionnel)</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                    <AlignLeft size={16} />
                                </div>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Détails du jalon..."
                                ></textarea>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="createJalonForm"
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? 'Création...' : 'Créer le jalon'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCreateJalon;
