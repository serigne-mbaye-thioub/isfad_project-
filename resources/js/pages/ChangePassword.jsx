import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

/**
 * ChangePassword — Bug fix #4
 * Écran dédié au changement de mot de passe obligatoire (première connexion).
 * Remplace l'alert() non professionnel de Login.jsx.
 */
const ChangePassword = () => {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPass !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/api/change-password', {
                mot_de_passe_actuel: current,
                nouveau_mot_de_passe: newPass,
                nouveau_mot_de_passe_confirmation: confirm,
            });

            // Mettre à jour premiere_connexion dans le localStorage
            const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
            user.premiere_connexion = false;
            localStorage.setItem('auth_user', JSON.stringify(user));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#eef2f7] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
            <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md border-t-4 border-[#0564A8]">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0564A8] flex items-center justify-center mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-900 mb-2">Sécurisez votre compte</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        C'est votre <strong className="text-gray-600">première connexion</strong>.<br />
                        Vous devez choisir un mot de passe personnel avant de continuer.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-[#FF3834] px-4 py-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mot de passe actuel (temporaire)</label>
                        <input
                            type="password"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nouveau mot de passe</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-sm"
                                required minLength={8}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <p className="text-gray-400 text-[11px] mt-1">Minimum 8 caractères</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0564A8] hover:bg-[#2897E8] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition flex justify-center items-center gap-2 text-sm shadow-md shadow-blue-100 mt-2"
                    >
                        {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
