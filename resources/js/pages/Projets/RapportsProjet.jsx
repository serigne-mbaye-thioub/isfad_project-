import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { FileText, Plus, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

const RapportsProjet = ({ projetId, currentUser }) => {
    const [rapports, setRapports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        titre: '',
        type_rapport: 'synthese',
        contenu: ''
    });
    const [fichier, setFichier] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchRapports = async () => {
        try {
            const res = await api.get(`/api/projets/${projetId}/rapports`);
            setRapports(Array.isArray(res.data) ? res.data : (res.data.data || []));
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des rapports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRapports();
    }, [projetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('titre', formData.titre);
            data.append('type_rapport', formData.type_rapport);
            data.append('contenu', formData.contenu);
            if (fichier) {
                data.append('fichier', fichier);
            }

            await api.post(`/api/projets/${projetId}/rapports`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setFormData({ titre: '', type_rapport: 'synthese', contenu: '' });
            setFichier(null);
            fetchRapports();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'ajout du rapport.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des rapports...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-900">Rapports du Projet</h2>
                    <p className="text-sm text-gray-500">Comptes-rendus, notes d'avancement et alertes</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#044c80] transition flex items-center gap-2 shadow-sm"
                >
                    <Plus size={16} /> Nouveau rapport
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {rapports.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun rapport disponible pour vous sur ce projet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rapports.map(rapport => (
                            <div key={rapport.id} className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-blue-300 transition-colors shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            rapport.type_rapport === 'performance' ? 'bg-red-50 text-red-600' :
                                            rapport.type_rapport === 'cloture' ? 'bg-purple-50 text-purple-600' :
                                            rapport.type_rapport === 'avancement' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {rapport.type_rapport.replace('_', '-')}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(rapport.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {rapport.url_export && (
                                        <a href={`/storage/${rapport.url_export}`} target="_blank" rel="noreferrer" className="text-[#0564A8] hover:text-blue-800 bg-blue-50 p-2 rounded-lg transition" title="Télécharger la pièce jointe">
                                            <Download size={14} />
                                        </a>
                                    )}
                                </div>
                                <h3 className="font-extrabold text-gray-900 mb-2">{rapport.titre}</h3>
                                {rapport.contenu && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{rapport.contenu}</p>
                                )}
                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                        {rapport.auteur?.prenom?.charAt(0)}{rapport.auteur?.nom?.charAt(0)}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">
                                        {rapport.auteur?.prenom} {rapport.auteur?.nom}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Ajout Rapport */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-[#0564A8]"/> Soumettre un Rapport
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Titre <span className="text-red-500">*</span></label>
                                <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm font-medium text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Type de rapport <span className="text-red-500">*</span></label>
                                <select required value={formData.type_rapport} onChange={e => setFormData({...formData, type_rapport: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm">
                                    <option value="synthese">Synthèse / Compte-rendu</option>
                                    <option value="avancement">Rapport d'avancement</option>
                                    <option value="performance">Performance & Qualité</option>
                                    <option value="budget">Suivi Budgétaire</option>
                                    <option value="cloture">Rapport de clôture</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Description / Contenu</label>
                                <textarea rows="4" value={formData.contenu} onChange={e => setFormData({...formData, contenu: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm" placeholder="Saisissez le contenu de votre rapport..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Pièce jointe (Optionnel)</label>
                                <input type="file" onChange={e => setFichier(e.target.files[0])} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0564A8] hover:file:bg-blue-100" />
                                <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, DOCX, ou Image. Max 20MB.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition">Annuler</button>
                            <button type="submit" disabled={submitting} className="flex-[2] py-3 rounded-xl bg-[#0564A8] text-white font-bold text-sm hover:bg-[#044c80] transition shadow-lg shadow-blue-200">
                                {submitting ? 'Envoi...' : 'Soumettre le rapport'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RapportsProjet;
