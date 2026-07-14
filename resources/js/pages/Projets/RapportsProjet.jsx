import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { FileText, Plus, Download, AlertTriangle, CheckCircle2, Users, MessageSquare, Send, Eye } from 'lucide-react';

const RapportsProjet = ({ projetId, currentUser }) => {
    const [rapports, setRapports] = useState([]);
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        titre: '',
        type_rapport: 'synthese',
        contenu: ''
    });
    const [fichier, setFichier] = useState(null);
    const [touteEquipe, setTouteEquipe] = useState(false);
    const [destinataires, setDestinataires] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Commentaires
    const [expandedRapport, setExpandedRapport] = useState(null);
    const [commentaires, setCommentaires] = useState([]);
    const [newCommentaire, setNewCommentaire] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const fetchData = async () => {
        try {
            const [resRapports, resMembres] = await Promise.all([
                api.get(`/api/projets/${projetId}/rapports`),
                api.get(`/api/projets/${projetId}/equipe`)
            ]);
            setRapports(Array.isArray(resRapports.data) ? resRapports.data : (resRapports.data.data || []));
            // L'API /equipe retourne un objet avec une clé membres
            const participants = resMembres.data.membres || [];
            setMembres(participants.map(m => m.utilisateur).filter(u => u.id !== currentUser?.id));
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('titre', formData.titre);
            data.append('type_rapport', formData.type_rapport);
            data.append('contenu', formData.contenu);
            data.append('toute_equipe', touteEquipe ? '1' : '0');
            
            if (!touteEquipe) {
                destinataires.forEach(d => {
                    data.append('destinataires[]', d);
                });
            }

            if (fichier) {
                data.append('fichier', fichier);
            }

            await api.post(`/api/projets/${projetId}/rapports`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setFormData({ titre: '', type_rapport: 'synthese', contenu: '' });
            setFichier(null);
            setTouteEquipe(false);
            setDestinataires([]);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'ajout du rapport.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDestinataireToggle = (id) => {
        if (destinataires.includes(id)) {
            setDestinataires(destinataires.filter(d => d !== id));
        } else {
            setDestinataires([...destinataires, id]);
        }
    };

    const loadCommentaires = async (rapportId) => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/api/rapports/${rapportId}/commentaires`);
            setCommentaires(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleRapport = (rapportId) => {
        if (expandedRapport === rapportId) {
            setExpandedRapport(null);
            setCommentaires([]);
        } else {
            setExpandedRapport(rapportId);
            loadCommentaires(rapportId);
        }
    };

    const handlePostCommentaire = async (rapportId) => {
        if (!newCommentaire.trim()) return;
        try {
            const res = await api.post(`/api/rapports/${rapportId}/commentaires`, { contenu: newCommentaire });
            setCommentaires([...commentaires, res.data]);
            setNewCommentaire('');
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'envoi du commentaire.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des rapports...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-900">Rapports & Documentation</h2>
                    <p className="text-sm text-gray-500">Partagez vos rapports en toute sécurité avec les bonnes personnes.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#044c80] transition flex items-center gap-2 shadow-sm"
                >
                    <Plus size={16} /> Partager un rapport
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {rapports.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun rapport ne vous a été partagé pour l'instant.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {rapports.map(rapport => (
                            <div key={rapport.id} className={`bg-white border transition-all shadow-sm rounded-2xl overflow-hidden ${expandedRapport === rapport.id ? 'border-[#0564A8] ring-1 ring-[#0564A8]' : 'border-gray-200 hover:border-blue-300'}`}>
                                <div className="p-5">
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
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                {new Date(rapport.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {rapport.url_export && (
                                            <a href={`/storage/${rapport.url_export}`} target="_blank" rel="noreferrer" className="text-[#0564A8] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition" title="Télécharger la pièce jointe">
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <h3 className="font-extrabold text-lg text-gray-900 mb-2">{rapport.titre}</h3>
                                    {rapport.contenu && (
                                        <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">{rapport.contenu}</p>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                        {/* Auteur et Destinataires */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-[#0564A8]">
                                                    {rapport.auteur?.prenom?.charAt(0)}{rapport.auteur?.nom?.charAt(0)}
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600">
                                                    Partagé par {rapport.auteur?.prenom} {rapport.auteur?.nom}
                                                </span>
                                            </div>
                                            
                                            {rapport.destinataires && rapport.destinataires.length > 0 && (
                                                <div className="flex items-center gap-2 ml-1">
                                                    <Eye size={12} className="text-gray-400" />
                                                    <div className="flex -space-x-2">
                                                        {rapport.destinataires.slice(0, 3).map(d => (
                                                            <div key={d.id} className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] font-bold text-gray-600" title={`${d.prenom} ${d.nom}`}>
                                                                {d.prenom?.charAt(0)}{d.nom?.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {rapport.destinataires.length > 3 && (
                                                        <span className="text-[10px] text-gray-400 font-medium">+{rapport.destinataires.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => toggleRapport(rapport.id)}
                                            className="text-xs font-bold text-[#0564A8] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                                        >
                                            <MessageSquare size={14} /> 
                                            {expandedRapport === rapport.id ? 'Masquer' : 'Commenter'}
                                        </button>
                                    </div>
                                </div>

                                {/* Zone de commentaires */}
                                {expandedRapport === rapport.id && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Discussions sur ce rapport</h4>
                                        
                                        {loadingComments ? (
                                            <p className="text-xs text-center text-gray-400 py-2">Chargement...</p>
                                        ) : (
                                            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                                                {commentaires.map(c => (
                                                    <div key={c.id} className={`flex gap-3 ${c.id_auteur === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                                                            {c.auteur?.prenom?.charAt(0)}{c.auteur?.nom?.charAt(0)}
                                                        </div>
                                                        <div className={`flex flex-col max-w-[80%] ${c.id_auteur === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                                            <span className="text-[10px] text-gray-400 font-medium mb-1">
                                                                {c.auteur?.prenom} {c.auteur?.nom} • {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                            <div className={`p-3 text-sm rounded-2xl shadow-sm ${c.id_auteur === currentUser?.id ? 'bg-[#0564A8] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                                                {c.contenu}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {commentaires.length === 0 && (
                                                    <p className="text-xs text-center text-gray-400 italic">Aucun commentaire pour le moment.</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={newCommentaire}
                                                onChange={e => setNewCommentaire(e.target.value)}
                                                onKeyDown={(e) => { if(e.key === 'Enter') handlePostCommentaire(rapport.id); }}
                                                placeholder="Ajouter un commentaire..." 
                                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#0564A8]/30 outline-none"
                                            />
                                            <button 
                                                onClick={() => handlePostCommentaire(rapport.id)}
                                                disabled={!newCommentaire.trim()}
                                                className="bg-[#0564A8] text-white p-2.5 rounded-xl hover:bg-[#044c80] disabled:opacity-50 transition"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Ajout Rapport */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-[#0564A8]"/> Partager un Rapport
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">×</button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Destinataires */}
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users size={16} className="text-[#0564A8]" /> Qui peut voir ce rapport ?
                                </h4>
                                
                                <label className="flex items-center gap-3 mb-4 cursor-pointer bg-white p-3 rounded-xl border border-gray-200 hover:border-[#0564A8] transition">
                                    <input 
                                        type="checkbox" 
                                        checked={touteEquipe}
                                        onChange={(e) => {
                                            setTouteEquipe(e.target.checked);
                                            if (e.target.checked) setDestinataires([]);
                                        }}
                                        className="w-5 h-5 text-[#0564A8] rounded focus:ring-[#0564A8]"
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Partager avec toute l'équipe</div>
                                        <div className="text-xs text-gray-500">Tout le monde recevra une notification</div>
                                    </div>
                                </label>

                                {!touteEquipe && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ou sélectionnez des personnes spécifiques :</p>
                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                            {membres.map(membre => (
                                                <label key={membre.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${destinataires.includes(membre.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={destinataires.includes(membre.id)}
                                                        onChange={() => handleDestinataireToggle(membre.id)}
                                                        className="rounded text-[#0564A8] focus:ring-[#0564A8]"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 text-[10px] font-bold flex items-center justify-center text-gray-600">
                                                            {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-700">{membre.prenom} {membre.nom}</span>
                                                    </div>
                                                </label>
                                            ))}
                                            {membres.length === 0 && <p className="text-xs text-gray-400 italic">Aucun autre membre dans ce projet.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Titre <span className="text-red-500">*</span></label>
                                    <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm font-medium text-gray-900" placeholder="Titre du rapport..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Type de rapport <span className="text-red-500">*</span></label>
                                    <select required value={formData.type_rapport} onChange={e => setFormData({...formData, type_rapport: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm font-medium">
                                        <option value="synthese">Synthèse / Compte-rendu</option>
                                        <option value="avancement">Rapport d'avancement</option>
                                        <option value="performance">Performance & Qualité</option>
                                        <option value="budget">Suivi Budgétaire</option>
                                        <option value="cloture">Rapport de clôture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Pièce jointe (Optionnel)</label>
                                    <input type="file" onChange={e => setFichier(e.target.files[0])} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#0564A8] file:text-white hover:file:bg-[#044c80] cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Description / Note explicative</label>
                                <textarea rows="3" value={formData.contenu} onChange={e => setFormData({...formData, contenu: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 transition text-sm" placeholder="Saisissez un résumé ou un commentaire accompagnant votre rapport..."></textarea>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 rounded-b-3xl">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">Annuler</button>
                            <button type="submit" disabled={submitting} className="flex-[2] py-3 rounded-xl bg-[#0564A8] text-white font-bold text-sm hover:bg-[#044c80] transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                                {submitting ? 'Partage en cours...' : <><Send size={16}/> Partager le rapport</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RapportsProjet;
