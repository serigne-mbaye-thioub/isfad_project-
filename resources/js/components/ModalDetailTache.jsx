import React, { useState } from 'react';
import { X, Clock, AlertCircle, PlayCircle, CheckCircle2, Edit2 } from 'lucide-react';
import api from '../axios';

const STATUS_MAP = {
    'a_faire': { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
    'en_cours': { label: 'En cours', color: 'bg-blue-100 text-[#0564A8]' },
    'en_revision': { label: 'En révision', color: 'bg-orange-100 text-orange-700' },
    'terminee': { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700' },
};

const PRIORITE_MAP = {
    'basse': 'bg-gray-100 text-gray-700',
    'moyenne': 'bg-gray-100 text-gray-700',
    'haute': 'bg-orange-100 text-orange-700',
    'critique': 'bg-red-100 text-red-700',
};

const UserBadge = ({ user, role, bgColor }) => {
    if (!user) return null;
    return (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className={`w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">{role}</p>
            </div>
        </div>
    );
};

const ModalDetailTache = ({ task, onClose, currentUser, membres = [], onTaskUpdate }) => {
    const [loadingResponsable, setLoadingResponsable] = useState(false);
    const [isEditingResponsable, setIsEditingResponsable] = useState(false);

    const [commentaires, setCommentaires] = useState([]);
    const [loadingCommentaires, setLoadingCommentaires] = useState(false);
    const [newCommentaire, setNewCommentaire] = useState('');
    const [submittingCommentaire, setSubmittingCommentaire] = useState(false);

    React.useEffect(() => {
        if (!task) return;
        const isResponsable = currentUser?.id === task.id_responsable;
        const isApprobateur = currentUser?.id === task.id_approbateur;
        const canAccessComments = isResponsable || isApprobateur;

        if (canAccessComments) {
            setLoadingCommentaires(true);
            api.get(`/api/taches/${task.id}/commentaires`)
                .then(res => setCommentaires(res.data))
                .catch(err => console.error("Erreur chargement commentaires", err))
                .finally(() => setLoadingCommentaires(false));
        }
    }, [task, currentUser]);

    if (!task) return null;

    const consultes = task.racis?.filter(r => r.role_raci === 'consulte').map(r => r.utilisateur) || [];
    const informes = task.racis?.filter(r => r.role_raci === 'informe').map(r => r.utilisateur) || [];

    const peutReaffecter = currentUser && ['Chef de projet', 'Gestionnaire de projet', 'Gestionnaire', 'Administrateur', 'Administrateur système'].includes(currentUser.fonction);
    const isResponsable = currentUser?.id === task.id_responsable;
    const isApprobateur = currentUser?.id === task.id_approbateur;
    const canAccessComments = isResponsable || isApprobateur;

    const handleReaffecter = async (newId) => {
        if (!newId) return;
        setLoadingResponsable(true);
        try {
            await api.patch(`/api/taches/${task.id}/responsable`, { id_responsable: parseInt(newId) });
            if (onTaskUpdate) onTaskUpdate();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de la réaffectation');
        } finally {
            setLoadingResponsable(false);
        }
    };

    const handleAddCommentaire = async (e) => {
        e.preventDefault();
        if (!newCommentaire.trim()) return;

        setSubmittingCommentaire(true);
        try {
            const res = await api.post(`/api/taches/${task.id}/commentaires`, { contenu: newCommentaire });
            setCommentaires([...commentaires, res.data.commentaire]);
            setNewCommentaire('');
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de l\'ajout du commentaire');
        } finally {
            setSubmittingCommentaire(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
                    <div className="pr-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${PRIORITE_MAP[task.priorite] || PRIORITE_MAP['moyenne']}`}>
                                Priorité: {task.priorite}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_MAP[task.statut]?.color}`}>
                                {STATUS_MAP[task.statut]?.label}
                            </span>
                        </div>
                        {(task.activite || task.phase_titre) && (
                            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                {task.activite?.phase?.titre || task.phase_titre || 'Sans phase'} 
                                <span className="mx-2 text-gray-300">›</span> 
                                {task.activite?.titre || task.activite_titre || 'Générale'}
                            </div>
                        )}
                        <h2 className="text-xl font-black text-[#0564A8] leading-tight">{task.titre}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 min-h-[60px]">
                            {task.description || <span className="italic text-gray-400">Aucune description fournie.</span>}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date de début</p>
                            <p className="text-sm font-semibold text-gray-900">{new Date(task.date_debut).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date Limite</p>
                            <p className={`text-sm font-semibold flex items-center gap-1 ${new Date(task.date_limite) < new Date() && task.statut !== 'terminee' ? 'text-red-600' : 'text-gray-900'}`}>
                                <Clock size={14} />
                                {new Date(task.date_limite).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    {/* Matrice RACI */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Matrice RACI</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Responsable & Approbateur */}
                            <div className="space-y-3">
                                {peutReaffecter && isEditingResponsable ? (
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Responsable (R)</p>
                                            <button 
                                                onClick={() => setIsEditingResponsable(false)}
                                                className="text-[10px] text-gray-400 hover:text-gray-700 font-bold uppercase transition"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                        <select 
                                            disabled={loadingResponsable}
                                            value={task.id_responsable || ''}
                                            onChange={(e) => {
                                                handleReaffecter(e.target.value);
                                                setIsEditingResponsable(false);
                                            }}
                                            className="w-full text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] cursor-pointer shadow-sm transition"
                                        >
                                            <option value="">-- Assigner à --</option>
                                            {membres.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom} {m.nom} {m.id === currentUser?.id ? '(Moi)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        {task.responsable ? (
                                            <UserBadge user={task.responsable} role="Responsable (R)" bgColor="bg-blue-600" />
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100">Aucun responsable assigné</div>
                                        )}
                                        {peutReaffecter && (
                                            <button 
                                                onClick={() => setIsEditingResponsable(true)}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 bg-white border border-gray-200 text-gray-500 hover:text-[#0564A8] hover:border-[#0564A8] p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                                                title="Modifier le responsable"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                            </div>

                            {/* Approbateur, Consultés & Informés */}
                            <div className="space-y-4">
                                {task.approbateur && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Approbateur (A)</p>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-medium" title={`${task.approbateur.prenom} ${task.approbateur.nom}`}>
                                                {task.approbateur.prenom} {task.approbateur.nom}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {consultes.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Consultés (C)</p>
                                        <div className="flex flex-wrap gap-2">
                                            {consultes.map(u => (
                                                <div key={`c-${u.id}`} className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-medium" title={`${u.prenom} ${u.nom}`}>
                                                    {u.prenom} {u.nom}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {informes.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Informés (I)</p>
                                        <div className="flex flex-wrap gap-2">
                                            {informes.map(u => (
                                                <div key={`i-${u.id}`} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-medium" title={`${u.prenom} ${u.nom}`}>
                                                    {u.prenom} {u.nom}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                    {/* Commentaires Privés (Responsable & Approbateur) */}
                    {canAccessComments && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Échanges Privés (Responsable & Approbateur)
                            </h4>
                            
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col h-[300px]">
                                {/* Liste des commentaires */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4">
                                    {loadingCommentaires ? (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0564A8]"></div>
                                        </div>
                                    ) : commentaires.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <p className="text-sm italic">Aucun échange pour le moment.</p>
                                        </div>
                                    ) : (
                                        commentaires.map(c => {
                                            const isMe = c.id_auteur === currentUser?.id;
                                            return (
                                                <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-[#0564A8] text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                                        <p className="text-sm whitespace-pre-wrap">{c.contenu}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 px-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {isMe ? 'Moi' : c.auteur?.prenom + ' ' + c.auteur?.nom}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400">
                                                            {new Date(c.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Formulaire */}
                                <form onSubmit={handleAddCommentaire} className="shrink-0 flex gap-2">
                                    <textarea
                                        value={newCommentaire}
                                        onChange={(e) => setNewCommentaire(e.target.value)}
                                        placeholder="Écrivez un message..."
                                        className="flex-1 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] resize-none h-[42px] custom-scrollbar"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddCommentaire(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingCommentaire || !newCommentaire.trim()}
                                        className="bg-[#0564A8] text-white px-4 rounded-xl font-bold hover:bg-[#04538c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                                    >
                                        Envoyer
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalDetailTache;
