import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { Lock, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

/* ─── Sous-composant : Formulaire Mot de passe oublié ─── */
const ForgotPasswordForm = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Adresse introuvable dans le système.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Code envoyé !</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Un code de sécurité a été envoyé à <strong className="text-gray-700">{email}</strong>.<br />
                    Consultez votre boite mail.
                </p>
                <button onClick={onBack} className="text-sm text-[#0564A8] hover:text-[#044c80] hover:underline font-bold transition">
                    ← Retour à la connexion
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0564A8] font-bold mb-6 transition">
                <ArrowLeft size={14} /> Retour
            </button>
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Mot de passe oublié</h2>
                <p className="text-gray-500 text-sm">Saisissez votre adresse email pour recevoir un code.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-[#FF3834] px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2 shadow-sm">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Adresse email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-sm shadow-sm"
                        placeholder="nom@ucad.edu.sn"
                        required
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0564A8] hover:bg-[#044c80] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-900/20"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Envoi en cours...
                        </>
                    ) : 'Envoyer le code'}
                </button>
            </form>
        </div>
    );
};

/* ─── Composant principal : Login ─── */
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.get('/sanctum/csrf-cookie');
            const response = await api.post('/api/login', {
                email,
                mot_de_passe: password,
            });

            const { access_token, utilisateur } = response.data;
            localStorage.setItem('auth_token', access_token);
            localStorage.setItem('auth_user', JSON.stringify(utilisateur));

            if (utilisateur?.premiere_connexion) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants incorrects. Vérifiez votre email et mot de passe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen relative" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
            
            {/* ── Background Image & Overlays ── */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/image-ucad.jpg')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#023e20]/60 via-[#0564A8]/40 to-[#071525]/80 backdrop-blur-[3px]"></div>

            {/* ── Navbar simplifiée (Optionnelle) ── */}
            <div className="absolute top-0 left-0 right-0 z-10 p-6 md:p-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center font-black text-[#0564A8] shadow-lg">
                        I
                    </div>
                    <div>
                        <p className="text-white font-extrabold tracking-widest text-sm drop-shadow-md">ISFAD</p>
                        <p className="text-white/80 text-[10px] uppercase font-semibold tracking-wider drop-shadow-sm">Gouvernance</p>
                    </div>
                </div>
            </div>

            {/* ── Center Content : The Glass Card ── */}
            <div className="flex-grow flex items-center justify-center z-10 p-4">
                <div className="w-full max-w-md">
                    
                    <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                        {showForgot ? (
                            <ForgotPasswordForm onBack={() => setShowForgot(false)} />
                        ) : (
                            <div className="p-8">
                                <div className="text-center mb-8 flex flex-col items-center">
                                    <span className="inline-flex items-center gap-2 bg-[#0564A8]/10 text-[#0564A8] px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 select-none border border-[#0564A8]/20">
                                        <Lock size={12} className="text-[#0564A8]" />
                                        Accès Restreint
                                    </span>
                                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Bienvenue</h1>
                                    <p className="text-gray-500 text-sm">Connectez-vous à votre espace de travail</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-[#FF3834] px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2 shadow-sm">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Adresse email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-gray-900 text-sm shadow-sm"
                                            placeholder="nom@ucad.edu.sn"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mot de passe</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0564A8]/30 focus:border-[#0564A8] transition text-gray-900 text-sm shadow-sm"
                                                placeholder="••••••••"
                                                autoComplete="current-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0564A8] transition"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0564A8] focus:ring-[#0564A8]" />
                                            <span className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition">Se souvenir de moi</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setError(''); setShowForgot(true); }}
                                            className="text-xs text-[#0564A8] hover:text-[#044c80] font-bold transition hover:underline"
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-2 bg-gradient-to-r from-[#0564A8] to-[#044c80] hover:from-[#044c80] hover:to-[#03365c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-900/20"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                Connexion en cours...
                                            </>
                                        ) : 'Accéder au portail'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Mentions en dessous de la carte */}
                    <div className="text-center mt-6">
                        <p className="text-white/70 text-xs drop-shadow-md">
                            &copy; {new Date().getFullYear()} Université Cheikh Anta Diop de Dakar
                        </p>
                    </div>

                </div>
            </div>
            
        </div>
    );
};

export default Login;
