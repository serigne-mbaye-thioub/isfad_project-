import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { Users, Plus, Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const ModalCreateUser = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', telephone: '', fonction: 'Membre d’équipe' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/admin/users', formData);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de création');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        'Administrateur', 'Administrateur système', 'Superviseur', 
        'Chef de projet', 'Gestionnaire de projet', 'Membre d’équipe', 
        'Partenaire', 'Architecte de projet'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={20} className="text-[#0564A8]" /> Créer un compte utilisateur</h3>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium">{error}</div>}

                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Prénom</label>
                            <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nom</label>
                            <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Email professionnel</label>
                        <input type="email" required className="w-full border rounded-lg p-2 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Téléphone</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Fonction / Rôle</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={formData.fonction} onChange={e => setFormData({...formData, fonction: e.target.value})}>
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">
                        {loading ? 'Création...' : 'Créer et envoyer les accès'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const UtilisateursAdmin = () => {
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            setUtilisateurs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (id, currentStatus) => {
        if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'réactiver'} ce compte ?`)) return;
        try {
            await api.patch(`/api/admin/users/${id}/statut`, { actif: !currentStatus });
            fetchUsers();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors du changement de statut');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Chargement des utilisateurs...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion des Utilisateurs</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Administration des accès et des rôles de la plateforme.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-[#0564A8] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
                    <Plus size={18} /> Créer un compte
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="p-4 font-bold">Utilisateur</th>
                            <th className="p-4 font-bold">Contact</th>
                            <th className="p-4 font-bold">Rôle</th>
                            <th className="p-4 font-bold text-center">Statut</th>
                            <th className="p-4 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {utilisateurs.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                            {u.prenom.charAt(0)}{u.nom.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{u.prenom} {u.nom}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-xs text-gray-600">{u.email}</p>
                                    <p className="text-xs text-gray-400">{u.telephone || 'Non renseigné'}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        u.fonction.includes('Admin') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {u.fonction}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {u.actif ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                                            <CheckCircle size={12} /> Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                                            <XCircle size={12} /> Inactif
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => toggleStatus(u.id, u.actif)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            u.actif ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                    >
                                        {u.actif ? 'Désactiver' : 'Activer'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {showModal && <ModalCreateUser onClose={() => setShowModal(false)} onSuccess={() => {setShowModal(false); fetchUsers();}} />}
        </div>
    );
};

export default UtilisateursAdmin;
