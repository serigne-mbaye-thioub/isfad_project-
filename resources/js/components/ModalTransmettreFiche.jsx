import React, { useState, useEffect } from 'react';
import { X, Upload, Edit3, Send, Paperclip, CheckCircle } from 'lucide-react';
import api from '../axios';

const ModalTransmettreFiche = ({ isOpen, onClose, onSuccess, projet }) => {
    const [activeTab, setActiveTab] = useState('rediger'); // 'rediger' or 'importer'
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [formData, setFormData] = useState({
        id_chef_projet: '',
        titre: '',
        objectif: '',
        description: '',
        fiche_projet: '',
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && projet) {
            let initialChefId = '';
            try {
                const user = JSON.parse(localStorage.getItem('auth_user'));
                if (user && (user.fonction === 'Chef de projet' || user.fonction === 'Architecte de projet' || user.fonction === 'Architecte')) {
                    // Préremplir avec l'utilisateur connecté s'il gère des projets
                    initialChefId = user.id;
                }
            } catch(e) {}

            setFormData({
                id_chef_projet: initialChefId,
                titre: projet.titre || '',
                objectif: projet.objectif || '',
                description: projet.description || '',
                fiche_projet: projet.description || '', // Default rich text is the description
            });
            fetchUsers(initialChefId);
        }
    }, [isOpen, projet]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/utilisateurs');
            // Filter only potential Chefs de projet if needed, or show all active
            setUtilisateurs(res.data.data || res.data);
        } catch (error) {
            console.error("Erreur utilisateurs", error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const data = new FormData();
        data.append('id_chef_projet', formData.id_chef_projet);
        data.append('titre', formData.titre);
        data.append('objectif', formData.objectif);
        
        if (activeTab === 'rediger') {
            data.append('description', formData.description);
            data.append('fiche_projet', formData.fiche_projet);
        } else {
            if (!file) {
                setError('Veuillez sélectionner un fichier à importer.');
                setLoading(false);
                return;
            }
            data.append('description', formData.description); // still keep description
            data.append('fiche_fichier', file);
        }

        try {
            await api.post(`/api/projets/${projet.id}/transmettre-chef`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la transmission.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-extrabold text-gray-900">Fiche projet à transmettre</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100 flex gap-3 items-start">
                        <span role="img" aria-label="info">📋</span>
                        <p>C'est la <strong>fiche projet</strong> qui est transmise au Chef de projet. Rédigez-la sur la plateforme ou importez un fichier déjà préparé.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('rediger')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'rediger' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Edit3 size={18} /> Rédiger la fiche
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('importer')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'importer' ? 'bg-[#0564A8]/10 text-[#0564A8] border border-[#0564A8]/20 shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Paperclip size={18} /> Importer la fiche
                        </button>
                    </div>

                    <form id="transmissionForm" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Chef de projet <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={formData.id_chef_projet}
                                onChange={e => setFormData({...formData, id_chef_projet: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                            >
                                <option value="">Sélectionner un chef de projet...</option>
                                {utilisateurs.map(u => (
                                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} - {u.fonction}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Titre <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.titre}
                                onChange={e => setFormData({...formData, titre: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                            />
                        </div>

                        {activeTab === 'rediger' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Objectif <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        rows="2"
                                        value={formData.objectif}
                                        onChange={e => setFormData({...formData, objectif: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description / Fiche Détaillée <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        rows="6"
                                        value={formData.fiche_projet}
                                        onChange={e => setFormData({...formData, fiche_projet: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition-all"
                                        placeholder="Rédigez la fiche détaillée du projet ici..."
                                    ></textarea>
                                </div>
                            </>
                        )}

                        {activeTab === 'importer' && (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                                <Upload size={40} className="mx-auto text-[#0564A8] mb-4" />
                                <p className="text-sm text-gray-600 mb-4 font-medium">Glissez-déposez le fichier ici ou cliquez pour parcourir.</p>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0564A8] hover:file:bg-blue-100 mx-auto"
                                />
                                {file && (
                                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg inline-block">
                                        <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                            <CheckCircle size={16} /> Fichier sélectionné : {file.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-[1] px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        form="transmissionForm"
                        disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-2 bg-[#0564A8] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#034f84] transition shadow-lg shadow-[#0564A8]/20 disabled:opacity-50"
                    >
                        <Send size={18} />
                        {loading ? 'Transmission...' : 'Transmettre au Chef de projet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalTransmettreFiche;
