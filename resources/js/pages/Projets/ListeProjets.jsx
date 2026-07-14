import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axios';
import { 
    FolderKanban, Plus, Search, Calendar, ChevronRight, 
    MoreVertical, Activity, AlertTriangle, PlayCircle, CheckCircle2, FileText, Users, LogOut, ArrowRight 
} from 'lucide-react';
import ModalInitierProjet from '../../components/ModalInitierProjet';
import ModalTransmettreFiche from '../../components/ModalTransmettreFiche';
import ModalConfirm from '../../components/ModalConfirm';

const ProjetCard = ({ projet, onClick, onEdit, onTransmettre, onTransmettreGestionnaire, onCreer, currentUser, onStatusChange }) => {
    const avancement = parseFloat(projet.avancement) || 0;
    const progressColor = avancement === 100 ? 'bg-emerald-500' : 'bg-[#0564A8]';
    
    // Helper pour le statut
    const getStatutLabel = (s) => {
        if (s === 'initie') return 'Initié';
        if (s === 'transmis_chef') return 'Transmis au Chef';
        if (s === 'en_cours') return 'En cours';
        if (s === 'suspendu') return 'En pause';
        if (s === 'cloture' || s === 'terminee') return 'Terminé';
        if (s === 'a_demarrer') return 'À démarrer';
        if (s === 'annule') return 'Annulé';
        if (s === 'archive') return 'Archivé';
        return s;
    };
    
    const isSuccess = projet.statut === 'cloture' || projet.statut === 'terminee';
    const isWarning = projet.statut === 'suspendu';
    const isInitie = projet.statut === 'initie';
    const isTransmis = projet.statut === 'transmis_chef';
    const isArchive = projet.statut === 'archive';
    const isAnnule = projet.statut === 'annule';

    return (
        <div className={`rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300 w-full mb-4 ${isArchive ? 'bg-gray-100 opacity-70 border-gray-200' : isAnnule ? 'bg-red-50/40 border-red-200 opacity-80' : 'bg-white border-gray-100'}`}>
            <div className="p-6 pb-5">
                {/* Ligne 1: Titre et Boutons */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight pr-4">
                        {projet.titre}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                        {isInitie && ['Architecte', 'Architecte de projet'].includes(currentUser?.fonction) && (
                            <button onClick={(e) => { e.stopPropagation(); onTransmettre(projet); }} className="px-5 py-2 bg-[#0564A8] text-white font-bold text-sm rounded-xl hover:bg-[#044c80] transition-colors shadow-sm">
                                Transmettre
                            </button>
                        )}
                        {isTransmis && currentUser?.fonction === 'Chef de projet' && !projet.transmis_gestionnaire && (
                            <button onClick={(e) => { e.stopPropagation(); onTransmettreGestionnaire(projet); }} className="px-5 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
                                Transmettre au gestionnaire
                            </button>
                        )}
                        {isTransmis && (currentUser?.fonction === 'Chef de projet' || (projet.transmis_gestionnaire && ['Gestionnaire', 'Gestionnaire de projet', 'Administrateur', 'Administrateur système'].includes(currentUser?.fonction))) && (
                            <button onClick={(e) => { e.stopPropagation(); onCreer(projet); }} className="px-5 py-2 bg-[#0564A8] text-white font-bold text-sm rounded-xl hover:bg-[#044c80] transition-colors shadow-sm">
                                Démarrer le projet
                            </button>
                        )}
                        {!isInitie && !isTransmis && (() => {
                            // Admins globaux
                            if (['Administrateur', 'Administrateur système'].includes(currentUser?.fonction)) return true;
                            // Fonctions qui ont le droit de modifier
                            if (['Chef de projet', 'Gestionnaire', 'Gestionnaire de projet', 'Superviseur'].includes(currentUser?.fonction)) return true;
                            // Rôle spécifique dans CE projet (gestionnaire ou chef_projet affecté)
                            const participation = projet.membres?.find(m => m.id === currentUser?.id);
                            if (participation?.role_projet && ['chef_projet', 'gestionnaire', 'architecte'].includes(participation.role_projet)) return true;
                            return false;
                        })() && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(projet); }} className="px-5 py-2 border border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">
                                Modifier
                            </button>
                        )}
                        <button onClick={() => onClick(projet.id)} className="px-5 py-2 border border-[#0564A8] text-[#0564A8] font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                            Détails
                        </button>
                    </div>
                </div>

                {/* Ligne 2: Badges */}
                <div className="flex gap-3 mb-4 items-center">
                    {projet.division && (
                        <span className="bg-blue-50 text-[#0564A8] px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                            {projet.division}
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : (isWarning ? 'bg-amber-500' : 'bg-[#0564A8]')}`}></span>
                        {(() => {
                            const participation = projet.membres?.find(m => m.id === currentUser?.id);
                            const canChangeStatus = ['Chef de projet', 'Gestionnaire', 'Gestionnaire de projet'].includes(currentUser?.fonction) || 
                                                  (participation && ['chef_projet', 'gestionnaire'].includes(participation.role_projet));
                            
                            if (canChangeStatus) {
                                return (
                                    <select
                                        value={projet.statut}
                                        onChange={(e) => { e.stopPropagation(); onStatusChange(projet.id, e.target.value); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`bg-transparent border-none py-0 pl-0 pr-6 cursor-pointer focus:ring-0 text-xs font-bold outline-none shadow-none ${isSuccess ? 'text-emerald-600' : (isWarning ? 'text-amber-600' : (isAnnule ? 'text-red-600' : 'text-[#0564A8]'))}`}
                                    >
                                        <option value="initie" className="text-gray-900">Initié</option>
                                        <option value="transmis_chef" className="text-gray-900">Transmis au Chef</option>
                                        <option value="a_demarrer" className="text-gray-900">À démarrer</option>
                                        <option value="en_cours" className="text-gray-900">En cours</option>
                                        <option value="suspendu" className="text-gray-900">En pause</option>
                                        <option value="cloture" className="text-gray-900">Terminé</option>
                                        <option value="annule" className="text-gray-900">Annulé</option>
                                        {projet.statut === 'archive' && <option value="archive" className="text-gray-900">Archivé</option>}
                                    </select>
                                );
                            }
                            return (
                                <span className={isSuccess ? 'text-emerald-600' : (isWarning ? 'text-amber-600' : (isAnnule ? 'text-red-600' : 'text-[#0564A8]'))}>
                                    {getStatutLabel(projet.statut)}
                                </span>
                            );
                        })()}
                    </div>
                </div>

                {/* Ligne 3: Textes */}
                <div className="mb-6 space-y-1.5">
                    {projet.objectif && (
                        <p className="text-sm text-gray-800 font-medium"><span className="font-bold">Objectif :</span> {projet.objectif}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {projet.description}
                    </p>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                    <div className={`${progressColor} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${avancement}%` }}></div>
                </div>

                {/* Bas de page (Avancement et Dates) */}
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Avancement : {Math.round(avancement)}%</span>
                    <span className="flex items-center gap-1">
                        {new Date(projet.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} 
                        <ChevronRight size={10} className="text-gray-400" /> 
                        {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Non définie'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ModalEditProjet = ({ projet, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        titre: projet.titre || '',
        objectif: projet.objectif || '',
        description: projet.description || '',
        statut: projet.statut || 'en_cours',
        division: projet.division || '',
        date_debut: projet.date_debut ? projet.date_debut.split('T')[0] : '',
        date_fin: projet.date_fin ? projet.date_fin.split('T')[0] : ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.put(`/api/projets/${projet.id}`, formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification. Vous n\'avez peut-être pas les droits.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10">
                    <h3 className="text-lg font-extrabold text-gray-900">
                        Modifier les informations du projet
                    </h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="overflow-y-auto px-8 py-6 custom-scrollbar">
                    <form id="editForm" onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-2 flex gap-2 items-center font-medium">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nom du projet <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all font-medium text-gray-900" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Objectif du projet <span className="text-red-500">*</span></label>
                            <textarea rows="2" required value={formData.objectif} onChange={e => setFormData({...formData, objectif: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm resize-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Description du projet <span className="text-red-500">*</span></label>
                            <textarea rows="2" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm resize-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Statut du projet <span className="text-red-500">*</span></label>
                            <select required value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm">
                                <option value="initie">Initié</option>
                                <option value="transmis_chef">Transmis au Chef</option>
                                <option value="a_demarrer">À démarrer</option>
                                <option value="en_cours">En cours</option>
                                <option value="suspendu">En pause</option>
                                <option value="cloture">Terminé</option>
                                <option value="annule">Annulé</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Division</label>
                            <select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm">
                                <option value="">Sélectionner...</option>
                                <option value="Infrastructure">Infrastructure</option>
                                <option value="Développement">Développement</option>
                                <option value="Cybersécurité">Cybersécurité</option>
                                <option value="Data">Data</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Début <span className="text-red-500">*</span></label>
                                <input type="date" required value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Fin prévue (optionnel)</label>
                                <input type="date" value={formData.date_fin} onChange={e => setFormData({...formData, date_fin: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm font-medium" />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-center gap-4 bg-white rounded-b-2xl sticky bottom-0 z-10">
                    <button type="submit" form="editForm" disabled={loading}
                        className="py-3 px-8 rounded-xl bg-[#0564A8] hover:bg-[#2897E8] text-white text-sm font-bold transition-all shadow-md shadow-blue-200 disabled:opacity-60 flex-1">
                        {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="py-3 px-6 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                        Annuler
                    </button>
                </div>
                
            </div>
        </div>
    );
};

// Modale de création / démarrage
const ModalCreateProjet = ({ onClose, onSuccess, currentUser, initialProjet }) => {
    const defaultChefProjet = currentUser?.fonction === 'Chef de projet' ? currentUser.id : '';
    const isFromInitie = !!initialProjet;

    const [formData, setFormData] = useState({
        titre: initialProjet?.titre || '', 
        description: initialProjet?.description || '', 
        date_debut: initialProjet?.date_debut ? initialProjet.date_debut.substring(0, 10) : '', 
        date_fin: initialProjet?.date_fin ? initialProjet.date_fin.substring(0, 10) : '', 
        priorite: initialProjet?.priorite || 'moyenne',
        fiche_projet: initialProjet?.fiche_projet || '', 
        id_chef_projet: defaultChefProjet,
        id_projet_initial: initialProjet?.id || null
    });
    
    // Toggle Sections
    const [includeKickoff, setIncludeKickoff] = useState(false);
    const [kickoffData, setKickoffData] = useState({
        reunion_date: '', reunion_heure: '', reunion_lieu: '', reunion_duree: 60, participants: []
    });

    const [includeEquipe, setIncludeEquipe] = useState(false);
    const [equipeData, setEquipeData] = useState([]); // Array of { id_utilisateur, role_projet }

    const [fichier, setFichier] = useState(null);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/api/utilisateurs').then(res => setUtilisateurs(res.data.data || res.data)).catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_chef_projet) { setError("Veuillez désigner un Chef de projet."); return; }
        
        if (includeKickoff) {
            if (!kickoffData.reunion_date || !kickoffData.reunion_heure) {
                setError("Veuillez renseigner la date et l'heure de la réunion de démarrage.");
                return;
            }
        }

        setLoading(true); setError('');
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (fichier) data.append('fichier', fichier);
            
            if (includeKickoff) {
                data.append('create_kickoff', 1);
                data.append('reunion_date', kickoffData.reunion_date);
                data.append('reunion_heure', kickoffData.reunion_heure);
                data.append('reunion_lieu', kickoffData.reunion_lieu);
                data.append('reunion_duree', kickoffData.reunion_duree);
                kickoffData.participants.forEach(pId => data.append('participants_reunion[]', pId));
            }

            if (includeEquipe && equipeData.length > 0) {
                equipeData.forEach((membre, index) => {
                    data.append(`equipe[${index}][id_utilisateur]`, membre.id_utilisateur);
                    data.append(`equipe[${index}][role_projet]`, membre.role_projet);
                });
            }

            await api.post('/api/projets', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du démarrage du projet.');
        } finally {
            setLoading(false);
        }
    };

    const rolesDisponibles = [
        { value: 'membre', label: "Membre d'équipe" },
        { value: 'partenaire', label: "Partenaire" },
        { value: 'architecte', label: "Architecte de projet" },
        { value: 'chef_projet', label: "Chef de projet" },
        { value: 'superviseur', label: "Superviseur" },
        { value: 'gestionnaire', label: "Gestionnaire de projet" },
        { value: 'admin', label: "Admin" }
    ];

    const addMembre = (userId) => {
        if (!equipeData.find(m => m.id_utilisateur === userId)) {
            setEquipeData([...equipeData, { id_utilisateur: userId, role_projet: 'membre' }]);
        }
    };

    const removeMembre = (userId) => {
        setEquipeData(equipeData.filter(m => m.id_utilisateur !== userId));
    };

    const updateMembreRole = (userId, newRole) => {
        setEquipeData(equipeData.map(m => m.id_utilisateur === userId ? { ...m, role_projet: newRole } : m));
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#f8fafc] rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-[#0564A8] to-[#043d7a] px-8 py-6 text-white relative flex-shrink-0 shadow-md">
                    <h3 className="text-xl font-extrabold flex items-center gap-3 relative z-10">
                        <PlayCircle size={28} className="text-blue-200" /> 
                        {isFromInitie ? 'Démarrer le Projet' : 'Créer un Nouveau Projet'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1 opacity-90 relative z-10">
                        Configurez les paramètres finaux, la réunion et l'équipe.
                    </p>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 p-8">
                    <form id="demarrer-projet-form" onSubmit={handleSubmit}>
                        {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex gap-2 items-center"><AlertTriangle size={16} /> {error}</div>}
                        
                        {/* SECTION 1: INFOS DU PROJET */}
                        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                                <span className="bg-blue-100 text-[#0564A8] w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> 
                                Informations Générales
                            </h4>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Titre <span className="text-red-500">*</span></label>
                                        <input type="text" required value={formData.titre} readOnly={isFromInitie} onChange={e => setFormData({...formData, titre: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium ${isFromInitie ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] text-gray-900'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Chef de projet <span className="text-red-500">*</span></label>
                                        <select required value={formData.id_chef_projet} onChange={e => setFormData({...formData, id_chef_projet: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm font-medium text-gray-900">
                                            <option value="">-- Sélectionner --</option>
                                            {utilisateurs.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.fonction})</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Description</label>
                                    <textarea rows="2" value={formData.description} readOnly={isFromInitie} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${isFromInitie ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] text-gray-900'}`}></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Date de début <span className="text-red-500">*</span></label>
                                        <input type="date" required value={formData.date_debut} readOnly={isFromInitie} onChange={e => setFormData({...formData, date_debut: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm ${isFromInitie ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] text-gray-900'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Date de fin prévue <span className="text-gray-400 font-normal lowercase">(Optionnel)</span></label>
                                        <input type="date" value={formData.date_fin} onChange={e => setFormData({...formData, date_fin: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm text-gray-900" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: RÉUNION DE DÉMARRAGE */}
                        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                            <div 
                                className={`p-5 flex items-center justify-between cursor-pointer transition ${includeKickoff ? 'bg-[#f4f8fb]' : 'hover:bg-gray-50'}`}
                                onClick={() => setIncludeKickoff(!includeKickoff)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${includeKickoff ? 'bg-[#0564A8] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-extrabold uppercase tracking-wide ${includeKickoff ? 'text-[#0564A8]' : 'text-gray-700'}`}>
                                            <span className="bg-blue-100 text-[#0564A8] w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] mr-2">2</span> 
                                            Organiser le Kick-off Meeting
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Planifiez immédiatement la réunion de lancement du projet.</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${includeKickoff ? 'bg-[#0564A8]' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${includeKickoff ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>

                            {includeKickoff && (
                                <div className="p-6 border-t border-blue-100 bg-[#fbfdff] space-y-5 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Date <span className="text-red-500">*</span></label>
                                            <input type="date" required value={kickoffData.reunion_date} onChange={e => setKickoffData({...kickoffData, reunion_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Heure <span className="text-red-500">*</span></label>
                                            <input type="time" required value={kickoffData.reunion_heure} onChange={e => setKickoffData({...kickoffData, reunion_heure: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Lieu / Lien visio</label>
                                            <input type="text" placeholder="Ex: Salle de réunion A..." value={kickoffData.reunion_lieu} onChange={e => setKickoffData({...kickoffData, reunion_lieu: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Durée prévue</label>
                                            <select value={kickoffData.reunion_duree} onChange={e => setKickoffData({...kickoffData, reunion_duree: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition-all text-sm">
                                                <option value="30">30 min</option>
                                                <option value="60">1 heure</option>
                                                <option value="90">1h 30</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: ÉQUIPE DU PROJET */}
                        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                            <div 
                                className={`p-5 flex items-center justify-between cursor-pointer transition ${includeEquipe ? 'bg-[#f4fbf7]' : 'hover:bg-gray-50'}`}
                                onClick={() => setIncludeEquipe(!includeEquipe)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${includeEquipe ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-extrabold uppercase tracking-wide ${includeEquipe ? 'text-emerald-700' : 'text-gray-700'}`}>
                                            <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] mr-2 ${includeEquipe ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>3</span> 
                                            Constituer l'Équipe
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Ajoutez immédiatement des membres et assignez leurs rôles.</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${includeEquipe ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${includeEquipe ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>

                            {includeEquipe && (
                                <div className="p-6 border-t border-emerald-100 bg-[#fbfdfc] animate-in slide-in-from-top-2 duration-200 flex flex-col md:flex-row gap-8">
                                    {/* Liste des utilisateurs disponibles */}
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">Utilisateurs disponibles</label>
                                        <div className="h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl p-2 space-y-1 custom-scrollbar">
                                            {utilisateurs.filter(u => u.id !== currentUser.id && u.id != formData.id_chef_projet && !equipeData.find(m => m.id_utilisateur === u.id)).map(u => (
                                                <div key={u.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{u.prenom} {u.nom}</p>
                                                        <p className="text-[10px] text-gray-500">{u.fonction}</p>
                                                    </div>
                                                    <button type="button" onClick={() => addMembre(u.id)} className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {utilisateurs.filter(u => u.id !== currentUser.id && u.id != formData.id_chef_projet && !equipeData.find(m => m.id_utilisateur === u.id)).length === 0 && (
                                                <p className="text-center text-xs text-gray-400 p-4">Tous les utilisateurs sont sélectionnés.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Membres sélectionnés et rôles */}
                                    <div className="flex-[1.5]">
                                        <label className="block text-[11px] font-bold text-emerald-600 mb-2 uppercase">Équipe Sélectionnée ({equipeData.length})</label>
                                        <div className="h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {equipeData.length === 0 ? (
                                                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400 text-xs font-medium">
                                                    Cliquez sur le + pour ajouter un membre
                                                </div>
                                            ) : (
                                                equipeData.map(membre => {
                                                    const u = utilisateurs.find(u => u.id === membre.id_utilisateur);
                                                    if (!u) return null;
                                                    return (
                                                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-left-2 duration-150">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{u.prenom} {u.nom}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <select 
                                                                    value={membre.role_projet}
                                                                    onChange={(e) => updateMembreRole(u.id, e.target.value)}
                                                                    className="text-xs py-1.5 px-2 bg-gray-50 border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                                                                >
                                                                    {rolesDisponibles.map(r => (
                                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                                    ))}
                                                                </select>
                                                                <button type="button" onClick={() => removeMembre(u.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                                    <LogOut size={14} className="rotate-180" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </form>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-3xl">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-white transition-all">
                        Annuler
                    </button>
                    <button form="demarrer-projet-form" type="submit" disabled={loading} className="px-8 py-2.5 rounded-xl bg-[#0564A8] hover:bg-[#044c80] text-white text-sm font-bold transition-all shadow-md shadow-blue-900/20 flex items-center gap-2">
                        {loading ? 'Démarrage...' : (isFromInitie ? 'Démarrer le projet' : 'Créer le projet')}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ListeProjets = () => {
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Nouvel état pour la modale d'édition
    const [editingProjet, setEditingProjet] = useState(null);
    const [confirmAction, setConfirmAction] = useState({ isOpen: false });
    
    const navigate = useNavigate();

    const currentUserStr = localStorage.getItem('auth_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const canCreateProjet = ['Gestionnaire', 'Gestionnaire de projet', 'Chef de projet', 'Administrateur', 'Administrateur système'].includes(currentUser?.fonction);
    const isArchitecte = ['Architecte', 'Architecte de projet'].includes(currentUser?.fonction);

    const fetchProjets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/projets');
            // Tri: projets archivés et annulés en bas, puis du plus récent au plus ancien
            const sorted = res.data.sort((a, b) => {
                const weightA = a.statut === 'archive' ? 2 : (a.statut === 'annule' ? 1 : 0);
                const weightB = b.statut === 'archive' ? 2 : (b.statut === 'annule' ? 1 : 0);
                if (weightA !== weightB) return weightA - weightB;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setProjets(sorted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjets(); }, []);

    const handleStatusChange = async (id, newStatut) => {
        try {
            await api.put(`/api/projets/${id}`, { statut: newStatut });
            fetchProjets();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur lors de la modification du statut');
        }
    };

    const normalizeText = (text) => 
        text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

    const filteredProjets = projets.filter(p => {
        const search = normalizeText(searchTerm);
        return normalizeText(p.titre).includes(search) || 
               normalizeText(p.description).includes(search) ||
               normalizeText(p.objectif).includes(search);
    });

    const [showInitierModal, setShowInitierModal] = useState(false);
    const [showTransmettreModal, setShowTransmettreModal] = useState(false);
    const [transmittingProjet, setTransmittingProjet] = useState(null);

    const [creatingProjet, setCreatingProjet] = useState(null);

    const handleTransmettre = (projet) => {
        setTransmittingProjet(projet);
        setShowTransmettreModal(true);
    };

    const handleCreer = (projet) => {
        setCreatingProjet(projet);
        setShowCreateModal(true);
    };

    const handleTransmettreGestionnaire = (projet) => {
        setConfirmAction({
            isOpen: true,
            title: 'Transmettre au gestionnaire',
            message: 'Êtes-vous sûr de vouloir transmettre ce projet au gestionnaire ? Une fois transmis, il pourra être validé et démarrer.',
            type: 'primary',
            onConfirm: async () => {
                try {
                    await api.post(`/api/projets/${projet.id}/transmettre`);
                    fetchProjets();
                } catch (err) {
                    alert(err.response?.data?.message || 'Erreur lors de la transmission');
                }
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {isArchitecte ? "Projets initiés" : "Mes projets"}
                </h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-sm font-bold text-gray-500 mr-2 capitalize">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '')}
                    </span>
                    <div className="relative flex-1 sm:flex-none">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un projet, une tâche..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Sous-titre et Bouton Nouveau Projet */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-medium text-gray-500">
                    {filteredProjets.length} projet(s) existant(s) · triés du plus récent au plus ancien
                </p>
                <div className="flex gap-3 flex-shrink-0">
                    {canCreateProjet && (
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#0564A8] hover:bg-[#044c80] text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Nouveau projet</span>
                        </button>
                    )}
                    {isArchitecte && (
                        <button 
                            onClick={() => setShowInitierModal(true)}
                            className="bg-[#0564A8] hover:bg-[#044c80] text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                        >
                            <span className="hidden sm:inline">Initier un projet</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Liste de projets */}
            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-40 animate-pulse w-full">
                            <div className="w-1/3 h-6 bg-gray-200 rounded-full mb-4"></div>
                            <div className="w-full h-4 bg-gray-100 rounded mb-2"></div>
                            <div className="w-3/4 h-4 bg-gray-100 rounded mb-6"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProjets.length === 0 ? (
                <div className="bg-white border border-gray-200 border-dashed rounded-3xl py-20 px-8 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-5">
                        <FolderKanban size={40} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Aucun projet trouvé</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Vous n'avez pas encore de projet ou aucun projet ne correspond à votre recherche.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-0">
                    {filteredProjets.map(projet => (
                        <ProjetCard 
                            key={projet.id} 
                            projet={projet} 
                            currentUser={currentUser}
                            onClick={(id) => navigate(`/projets/${id}`)} 
                            onEdit={(p) => setEditingProjet(p)}
                            onTransmettre={handleTransmettre}
                            onTransmettreGestionnaire={handleTransmettreGestionnaire}
                            onCreer={handleCreer}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}

            {/* Modales */}
            {showInitierModal && (
                <ModalInitierProjet 
                    isOpen={showInitierModal}
                    onClose={() => setShowInitierModal(false)}
                    onSuccess={() => {
                        setShowInitierModal(false);
                        fetchProjets();
                    }}
                />
            )}

            {showTransmettreModal && transmittingProjet && (
                <ModalTransmettreFiche 
                    isOpen={showTransmettreModal}
                    projet={transmittingProjet}
                    onClose={() => {
                        setShowTransmettreModal(false);
                        setTransmittingProjet(null);
                    }}
                    onSuccess={() => {
                        setShowTransmettreModal(false);
                        setTransmittingProjet(null);
                        fetchProjets();
                    }}
                />
            )}

            {showCreateModal && (
                <ModalCreateProjet 
                    currentUser={currentUser}
                    initialProjet={creatingProjet}
                    onClose={() => {
                        setShowCreateModal(false);
                        setCreatingProjet(null);
                    }}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setCreatingProjet(null);
                        fetchProjets();
                    }}
                />
            )}

            {editingProjet && (
                <ModalEditProjet 
                    projet={editingProjet}
                    onClose={() => setEditingProjet(null)}
                    onSuccess={() => {
                        setEditingProjet(null);
                        fetchProjets();
                    }}
                />
            )}

            {/* Modal de confirmation globale */}
            <ModalConfirm 
                {...confirmAction} 
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })} 
            />
        </div>
    );
};

export default ListeProjets;
