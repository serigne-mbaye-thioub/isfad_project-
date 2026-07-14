import React, { useEffect, useState, useCallback } from 'react';
import api from '../axios';
import {
    Users, UserPlus, UserMinus, Crown, ChevronDown,
    AlertTriangle, Loader2, RefreshCw, Shield, Briefcase,
    CheckCircle2, X, Star, Eye, Activity
} from 'lucide-react';

// ── Constantes ──────────────────────────────────────────────────────────────
const ROLES = [
    { value: 'membre',       label: "Membre d'équipe",  icon: <Users size={14} />,     color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: 'partenaire',   label: 'Partenaire',       icon: <Users size={14} />,     color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'architecte',   label: 'Architecte de projet', icon: <Shield size={14} />,   color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'chef_projet',  label: 'Chef de projet',   icon: <Star size={14} />,      color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'superviseur',  label: 'Superviseur',      icon: <Eye size={14} />,       color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { value: 'gestionnaire', label: 'Gestionnaire de projet', icon: <Activity size={14} />, color: 'text-[#0564A8] bg-blue-50 border-blue-200' },
    { value: 'admin',        label: 'Admin',            icon: <Shield size={14} />,    color: 'text-red-600 bg-red-50 border-red-200' },
];

const getRoleInfo = (value) => ROLES.find(r => r.value === value) || { label: value, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };

// ── Composant Badge Rôle ─────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
    const info = getRoleInfo(role);
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
            {info.icon}
            {info.label}
        </span>
    );
};

// ── Composant Avatar Initiales ───────────────────────────────────────────────
const Avatar = ({ nom, prenom, size = 'md' }) => {
    const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
    const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500'];
    const color = colors[(nom?.charCodeAt(0) || 0) % colors.length];
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    return (
        <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {initiales}
        </div>
    );
};

// ── Modale d'ajout de membre ─────────────────────────────────────────────────
const ModalAjoutMembre = ({ projetId, onClose, onSuccess }) => {
    const [disponibles, setDisponibles] = useState([]);
    const [selected, setSelected] = useState([]);
    const [role, setRole] = useState('membre');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/api/utilisateurs/disponibles?projet_id=${projetId}`)
            .then(res => setDisponibles(Array.isArray(res.data) ? res.data : (res.data.data || [])))
            .catch(() => setError('Impossible de charger les utilisateurs disponibles.'))
            .finally(() => setLoading(false));
    }, [projetId]);

    const handleCheckboxChange = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(item => item !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selected.length === 0) return;
        setSaving(true);
        setError('');
        try {
            await Promise.all(selected.map(id_utilisateur => 
                api.post(`/api/projets/${projetId}/equipe`, {
                    id_utilisateur: parseInt(id_utilisateur),
                    role_projet: role,
                })
            ));
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout multiple.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <UserPlus size={18} className="text-[#0564A8]" /> Ajouter un membre
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                            Sélectionner un utilisateur
                        </label>
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                                <Loader2 size={16} className="animate-spin" /> Chargement...
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
                                {disponibles.map(u => (
                                    <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition">
                                        <input 
                                            type="checkbox" 
                                            checked={selected.includes(u.id)}
                                            onChange={() => handleCheckboxChange(u.id)}
                                            className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{u.prenom} {u.nom}</span>
                                            <span className="text-xs text-gray-500">{u.fonction}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        {!loading && disponibles.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1">Tous les utilisateurs actifs sont déjà membres de ce projet.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Rôle dans le projet</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] text-sm transition"
                        >
                            {ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving || selected.length === 0}
                            className="flex-1 py-2.5 rounded-lg bg-[#0564A8] hover:bg-[#2897E8] text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            {saving ? 'Ajout...' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Composant Carte Membre ───────────────────────────────────────────────────
const CarteMembre = ({ participation, peutGerer, onRetirer, onUpdateRole, isCurrentUser }) => {
    const { utilisateur, role_projet, statut, date_affectation, participation_id } = participation;
    const [editingRole, setEditingRole] = useState(false);
    const [newRole, setNewRole] = useState(role_projet);
    const [saving, setSaving] = useState(false);

    const handleRoleChange = async () => {
        setSaving(true);
        try {
            await onUpdateRole(participation_id, newRole);
            setEditingRole(false);
        } catch (e) {
            // L'erreur est gérée dans le parent
        } finally {
            setSaving(false);
        }
    };

    const isRetire = statut === 'retire';

    return (
        <div className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-all ${isRetire ? 'opacity-50' : 'hover:shadow-md'}`}>
            <Avatar nom={utilisateur?.nom} prenom={utilisateur?.prenom} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">
                        {utilisateur?.prenom} {utilisateur?.nom}
                        {isCurrentUser && <span className="ml-1 text-[10px] text-[#0564A8] font-semibold">(vous)</span>}
                    </p>
                    {isRetire && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">Retiré</span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{utilisateur?.email}</p>
                <p className="text-xs text-gray-400">{utilisateur?.fonction}</p>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {editingRole ? (
                        <div className="flex items-center gap-2">
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                                className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-[#0564A8] focus:border-[#0564A8]"
                            >
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <button onClick={handleRoleChange} disabled={saving}
                                className="text-xs bg-[#0564A8] text-white px-2.5 py-1 rounded-md font-semibold hover:bg-[#2897E8] transition disabled:opacity-60">
                                {saving ? '...' : 'OK'}
                            </button>
                            <button onClick={() => { setEditingRole(false); setNewRole(role_projet); }}
                                className="text-xs text-gray-400 hover:text-gray-700 px-2">
                                ✕
                            </button>
                        </div>
                    ) : (
                        <>
                            <RoleBadge role={role_projet} />
                            {peutGerer && !isRetire && (
                                <button onClick={() => setEditingRole(true)}
                                    className="text-[10px] text-gray-400 hover:text-[#0564A8] transition font-medium">
                                    modifier
                                </button>
                            )}
                        </>
                    )}
                </div>

                {date_affectation && (
                    <p className="text-[10px] text-gray-300 mt-1.5">
                        Depuis le {new Date(date_affectation).toLocaleDateString('fr-FR')}
                    </p>
                )}
            </div>

            {peutGerer && !isRetire && (
                <button
                    onClick={() => onRetirer(participation_id, utilisateur)}
                    className="text-gray-300 hover:text-[#FF3834] transition p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                    title={`Retirer ${utilisateur?.prenom} de l'équipe`}
                >
                    <UserMinus size={16} />
                </button>
            )}
        </div>
    );
};

// ── Composant Principal : GestionEquipe ─────────────────────────────────────
const GestionEquipe = ({ projetId, currentUser }) => {
    const [equipe, setEquipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [alerteRetrait, setAlerteRetrait] = useState(null);

    const chargerEquipe = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/projets/${projetId}/equipe`);
            setEquipe(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible de charger l\'équipe.');
        } finally {
            setLoading(false);
        }
    }, [projetId]);

    useEffect(() => { chargerEquipe(); }, [chargerEquipe]);

    const currentUserId = currentUser?.id;
    const currentUserParticipation = equipe?.membres?.find(m => m.utilisateur?.id === currentUserId);
    
    const isGlobalManager = ['Administrateur', 'Administrateur système', 'Gestionnaire de projet', 'Chef de projet', 'Superviseur'].includes(currentUser?.fonction);
    
    const peutGerer = isGlobalManager || (currentUserParticipation
        ? ['chef_projet', 'gestionnaire'].includes(currentUserParticipation.role_projet)
        : false);

    const handleRetirer = async (participationId, utilisateur) => {
        if (!window.confirm(`Retirer ${utilisateur?.prenom} ${utilisateur?.nom} de l'équipe ?`)) return;
        try {
            const res = await api.delete(`/api/projets/${projetId}/equipe/${participationId}`);
            // Si des tâches sont affectées, afficher une alerte
            if (res.data.taches_sans_resp) {
                setAlerteRetrait(res.data);
            }
            chargerEquipe();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors du retrait.');
        }
    };

    const handleUpdateRole = async (participationId, newRole) => {
        try {
            await api.patch(`/api/projets/${projetId}/equipe/${participationId}`, { role_projet: newRole });
            chargerEquipe();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la modification du rôle.');
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400">
                <Loader2 size={24} className="animate-spin mr-2" /> Chargement de l'équipe...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
            </div>
        );
    }

    const membresActifs = equipe?.membres?.filter(m => m.statut === 'actif') || [];
    const membresRetires = equipe?.membres?.filter(m => m.statut === 'retire') || [];

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0564A8]/10 flex items-center justify-center">
                        <Users size={20} className="text-[#0564A8]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">{equipe?.titre}</h2>
                        <p className="text-xs text-gray-400">{membresActifs.length} membre{membresActifs.length > 1 ? 's' : ''} actif{membresActifs.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={chargerEquipe}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <RefreshCw size={16} />
                    </button>
                    {peutGerer && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#0564A8] hover:bg-[#2897E8] text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm shadow-blue-200"
                        >
                            <UserPlus size={16} /> Ajouter un membre
                        </button>
                    )}
                </div>
            </div>

            {/* Alerte tâches sans responsable */}
            {alerteRetrait && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800 mb-1">{alerteRetrait.message}</p>
                        <p className="text-xs text-amber-600 mb-2">{alerteRetrait.action_requise}</p>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(alerteRetrait.taches_sans_resp || {}).map(([titre, id]) => (
                                <span key={id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{titre}</span>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setAlerteRetrait(null)} className="text-amber-400 hover:text-amber-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Liste membres actifs */}
            <div className="space-y-3 mb-6">
                {membresActifs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun membre actif dans ce projet.</p>
                    </div>
                ) : (
                    membresActifs.map(m => (
                        <CarteMembre
                            key={m.participation_id}
                            participation={m}
                            peutGerer={peutGerer}
                            onRetirer={handleRetirer}
                            onUpdateRole={handleUpdateRole}
                            isCurrentUser={m.utilisateur?.id === currentUserId}
                        />
                    ))
                )}
            </div>

            {/* Section membres retirés (repliable) */}
            {membresRetires.length > 0 && (
                <details className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <summary className="cursor-pointer text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                        Anciens membres ({membresRetires.length})
                    </summary>
                    <div className="mt-4 space-y-3">
                        {membresRetires.map(m => (
                            <CarteMembre
                                key={m.participation_id}
                                participation={m}
                                peutGerer={false}
                                onRetirer={() => {}}
                                onUpdateRole={() => {}}
                                isCurrentUser={false}
                            />
                        ))}
                    </div>
                </details>
            )}

            {/* Modale d'ajout */}
            {showModal && (
                <ModalAjoutMembre
                    projetId={projetId}
                    onClose={() => setShowModal(false)}
                    onSuccess={chargerEquipe}
                />
            )}
        </div>
    );
};

export default GestionEquipe;
