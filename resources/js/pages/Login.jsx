import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { Lock, FileText, Users, Calendar, BarChart3, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Étape 1 : obtenir le cookie CSRF de Sanctum
            await api.get('/sanctum/csrf-cookie');

            // Étape 2 : envoyer les identifiants
            const response = await api.post('/api/login', { email, password });

            const { token, utilisateur } = response.data;

            // Bug fix #5 : on stocke le token ET l'utilisateur dans localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(utilisateur));

            // Bug fix #4 : redirection vers page dédiée si première connexion
            if (utilisateur?.premiere_connexion) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const modules = [
        { icon: <BarChart3 size={22} />, title: "Tableau de bord", desc: "Statistiques et suivi", color: "border-blue-400", bg: "bg-blue-50", iconColor: "text-blue-600" },
        { icon: <FileText size={22} />, title: "Projets & Tâches", desc: "Kanban et phases", color: "border-violet-400", bg: "bg-violet-50", iconColor: "text-violet-600" },
        { icon: <AlertCircle size={22} />, title: "Demandes", desc: "Modifications et workflow", color: "border-orange-400", bg: "bg-orange-50", iconColor: "text-orange-500" },
        { icon: <Users size={22} />, title: "Équipes", desc: "Membres et rôles RACI", color: "border-emerald-400", bg: "bg-emerald-50", iconColor: "text-emerald-600" },
        { icon: <Calendar size={22} />, title: "Réunions", desc: "Planning et invitations", color: "border-indigo-400", bg: "bg-indigo-50", iconColor: "text-indigo-600" },
        { icon: <Lock size={22} />, title: "Budget", desc: "Dépenses et suivi", color: "border-red-300", bg: "bg-red-50", iconColor: "text-red-400" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
            <div className="flex-grow flex flex-col md:flex-row">

                {/* ── Côté Gauche : Formulaire ── */}
                <div className="w-full md:w-5/12 lg:w-2/5 flex items-center justify-center p-8 bg-white shadow-xl z-10">
                    <div className="w-full max-w-sm">

                        {/* Logo */}
                        <div className="text-center mb-10 flex flex-col items-center">
                            <div className="w-20 h-20 bg-[#0564A8] rounded-full flex items-center justify-center font-black text-white text-lg mb-4 shadow-lg ring-4 ring-blue-100">
                                ISFAD
                            </div>
                            <span className="inline-flex items-center gap-2 bg-[#e8f4fd] text-[#0564A8] px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-5 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00ACEF] animate-pulse"></span>
                                GOUVERNANCE · UCAD
                            </span>
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Connexion</h1>
                            <p className="text-gray-400 text-sm">Accédez à votre espace de travail</p>
                        </div>

                        {/* Erreur */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-[#FF3834] px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Formulaire */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Adresse email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-gray-900 text-sm"
                                    placeholder="nom@isfad.sn"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-gray-900 text-sm"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-xs text-[#0564A8] hover:text-[#2897E8] font-semibold transition"
                                    onClick={() => alert('Fonctionnalité : entrez votre email et un lien vous sera envoyé.')}
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#0564A8] hover:bg-[#2897E8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition duration-200 flex justify-center items-center gap-2 text-sm shadow-md shadow-blue-200"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Vérification...
                                    </>
                                ) : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Côté Droit : Présentation institutionnelle ── */}
                <div className="hidden md:flex w-full md:w-7/12 lg:w-3/5 flex-col bg-[#eef2f7] overflow-hidden">

                    {/* Bannière bleue */}
                    <div className="bg-gradient-to-br from-[#0564A8] to-[#043d7a] px-12 py-14 text-white relative overflow-hidden flex-shrink-0">
                        {/* Cercles décoratifs */}
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"></div>
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5"></div>

                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Progiciel de Gestion Intégré
                        </div>

                        <h2 className="text-3xl font-extrabold mb-3 leading-tight relative z-10">
                            Bienvenue dans votre<br/>
                            <span className="text-[#00ACEF]">Espace Gouvernance</span>
                        </h2>
                        <p className="text-blue-200 text-sm font-medium tracking-wide uppercase relative z-10">
                            Université Cheikh Anta Diop de Dakar
                        </p>
                    </div>

                    {/* Grille des modules */}
                    <div className="flex-grow p-10 flex flex-col">
                        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-7">
                            Ce que vous trouverez ici
                        </p>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                            {modules.map((mod, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white p-5 rounded-xl border-t-4 ${mod.color} shadow-sm hover:shadow-md transition-all duration-200 group cursor-default`}
                                >
                                    <div className={`w-10 h-10 ${mod.bg} rounded-lg flex items-center justify-center ${mod.iconColor} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                                        {mod.icon}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-0.5">{mod.title}</h3>
                                    <p className="text-gray-400 text-xs mb-3">{mod.desc}</p>
                                    <div className="flex items-center gap-1.5 text-gray-300 text-[10px] font-semibold uppercase tracking-wider">
                                        <Lock size={9} />
                                        <span>Connexion requise</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <footer className="bg-[#071525] text-white py-8 px-10 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm">
                    <div>
                        <p className="font-extrabold text-base tracking-widest uppercase mb-0.5">ISFAD · UCAD</p>
                        <p className="text-blue-300/70 text-xs">Institut Supérieur de Formation À Distance · Université Cheikh Anta Diop de Dakar</p>
                    </div>
                    <div className="flex gap-12">
                        <div>
                            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Support</p>
                            <p className="text-gray-400 text-xs">dsi@isfad.sn</p>
                            <p className="text-gray-500 text-xs">+221 33 000 00 00</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Accès rapide</p>
                            <a href="/login" className="block text-gray-400 text-xs hover:text-white transition mb-1">Se connecter</a>
                            <span className="block text-gray-600 text-xs">Mot de passe oublié</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;
