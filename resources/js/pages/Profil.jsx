import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Save, CheckCircle, Shield, Edit2, X, AlertCircle } from 'lucide-react';
import api from '../axios';

const Profil = () => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('auth_user')) || {};
        } catch {
            return {};
        }
    });
    
    const [activeTab, setActiveTab] = useState('infos');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = React.useRef(null);

    // State infos
    const [formData, setFormData] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        telephone: user?.telephone || '',
    });

    // State password
    const [pwdData, setPwdData] = useState({
        current_password: '',
        nouveau_mot_de_passe: '',
        nouveau_mot_de_passe_confirmation: ''
    });

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await api.post('/api/me/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccessMsg('Photo de profil mise à jour avec succès.');
            
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Reload page to reflect everywhere
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            setErrorMsg(e.response?.data?.message || 'Erreur lors du téléchargement de la photo.');
        } finally {
            setLoading(false);
        }
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        
        try {
            const res = await api.put('/api/me', formData);
            setSuccessMsg('Profil mis à jour avec succès.');
            
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            setErrorMsg(e.response?.data?.message || 'Erreur lors de la mise à jour.');
        } finally {
            setLoading(false);
        }
    };

    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.put('/api/me/password', pwdData);
            setSuccessMsg('Mot de passe modifié avec succès.');
            setPwdData({ current_password: '', nouveau_mot_de_passe: '', nouveau_mot_de_passe_confirmation: '' });
        } catch (e) {
            const validationErrors = e.response?.data?.errors;
            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0][0];
                setErrorMsg(firstError);
            } else {
                setErrorMsg(e.response?.data?.message || 'Erreur de modification du mot de passe.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="mb-8 flex-shrink-0">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Mon Profil</h1>
                <p className="text-gray-500 text-base font-medium">Gérez vos informations personnelles et vos paramètres de sécurité avec simplicité.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-80 bg-gray-50/50 border-r border-gray-100 p-8 flex-shrink-0 flex flex-col">
                    <div className="flex flex-col items-center mb-10 pt-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {user?.photo_profil_url ? (
                                <img src={user.photo_profil_url} alt="Profil" className="w-28 h-28 object-cover rounded-full shadow-lg shadow-[#0564A8]/20 ring-4 ring-white mb-4" />
                            ) : (
                                <div className="w-28 h-28 bg-gradient-to-tr from-[#0564A8] to-[#00ACEF] text-white rounded-full flex items-center justify-center text-4xl font-black shadow-lg shadow-[#0564A8]/20 ring-4 ring-white mb-4">
                                    {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 mb-4 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold text-center px-2">Modifier<br/>la photo</span>
                            </div>
                            <div className="absolute bottom-4 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white" title="Compte Actif"></div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handlePhotoUpload} 
                            accept="image/png, image/jpeg, image/jpg" 
                            className="hidden" 
                        />
                        <h2 className="font-extrabold text-gray-900 text-xl text-center leading-tight mb-1">{user?.prenom} {user?.nom}</h2>
                        <span className="bg-[#0564A8]/10 text-[#0564A8] text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mt-2">{user?.fonction}</span>
                    </div>

                    <nav className="space-y-2 w-full">
                        <button 
                            onClick={() => { setActiveTab('infos'); setSuccessMsg(''); setErrorMsg(''); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${activeTab === 'infos' ? 'bg-white shadow-sm border border-gray-100 text-[#0564A8]' : 'text-gray-500 hover:bg-white hover:text-gray-800 border border-transparent'}`}
                        >
                            <User size={20} className={activeTab === 'infos' ? 'text-[#0564A8]' : 'text-gray-400'} /> 
                            Informations
                        </button>
                        <button 
                            onClick={() => { setActiveTab('securite'); setSuccessMsg(''); setErrorMsg(''); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${activeTab === 'securite' ? 'bg-white shadow-sm border border-gray-100 text-[#0564A8]' : 'text-gray-500 hover:bg-white hover:text-gray-800 border border-transparent'}`}
                        >
                            <Shield size={20} className={activeTab === 'securite' ? 'text-[#0564A8]' : 'text-gray-400'} /> 
                            Sécurité
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 flex-1 overflow-y-auto">
                    
                    {successMsg && (
                        <div className="mb-8 bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 font-medium border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle size={20} /> {successMsg}
                        </div>
                    )}
                    
                    {errorMsg && (
                        <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} /> {errorMsg}
                        </div>
                    )}

                    {activeTab === 'infos' && (
                        <div className="animate-in fade-in duration-300 max-w-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                                    <User size={26} className="text-[#0564A8]" /> Informations personnelles
                                </h3>
                                {!isEditing && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm font-bold text-gray-500 hover:text-[#0564A8] bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-xl transition flex items-center gap-2"
                                    >
                                        <Edit2 size={16} /> Modifier
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prénom</p>
                                            <p className="text-lg font-bold text-gray-800">{user.prenom}</p>
                                        </div>
                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nom</p>
                                            <p className="text-lg font-bold text-gray-800">{user.nom}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse Email</p>
                                            <p className="text-base font-bold text-gray-800">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                                            <p className="text-base font-bold text-gray-800">{user.telephone || <span className="text-gray-400 italic font-normal">Non renseigné</span>}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleInfoSubmit} className="space-y-6 bg-white border border-gray-100 shadow-xl shadow-[#0564A8]/5 p-8 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Prénom</label>
                                            <input 
                                                type="text" 
                                                value={formData.prenom}
                                                onChange={e => setFormData({...formData, prenom: e.target.value})}
                                                className="w-full border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] text-base py-3 transition shadow-sm" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                                            <input 
                                                type="text" 
                                                value={formData.nom}
                                                onChange={e => setFormData({...formData, nom: e.target.value})}
                                                className="w-full border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] text-base py-3 transition shadow-sm" 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Adresse email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                <Mail size={18} />
                                            </div>
                                            <input 
                                                type="email" 
                                                value={user?.email || ''} 
                                                readOnly 
                                                disabled
                                                className="w-full pl-12 border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-base py-3 cursor-not-allowed shadow-inner" 
                                            />
                                        </div>
                                        <p className="text-[11px] font-bold text-orange-500 mt-2 flex items-center gap-1">
                                            <Lock size={10} /> L'adresse email est unique et ne peut pas être modifiée.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Numéro de téléphone</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                <Phone size={18} />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={formData.telephone}
                                                onChange={e => setFormData({...formData, telephone: e.target.value})}
                                                className="w-full pl-12 border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] text-base py-3 transition shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6 flex items-center gap-3 border-t border-gray-100">
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="bg-[#0564A8] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#044c80] transition shadow-md disabled:opacity-70 flex-1 justify-center"
                                        >
                                            <Save size={18} /> Enregistrer
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || ''});
                                            }}
                                            className="bg-white text-gray-500 border border-gray-200 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition flex-1 justify-center"
                                        >
                                            <X size={18} /> Annuler
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'securite' && (
                        <div className="animate-in fade-in duration-300 max-w-lg">
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                                <Shield size={26} className="text-orange-500" /> Mot de passe
                            </h3>
                            <p className="text-gray-500 text-sm mb-8">Il est recommandé de choisir un mot de passe robuste et de ne le partager avec personne.</p>
                            
                            <form onSubmit={handlePwdSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe actuel</label>
                                    <input 
                                        type="password" 
                                        value={pwdData.current_password}
                                        onChange={e => setPwdData({...pwdData, current_password: e.target.value})}
                                        className="w-full border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base py-3 shadow-sm transition" 
                                        required 
                                    />
                                </div>
                                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nouveau mot de passe</label>
                                        <input 
                                            type="password" 
                                            value={pwdData.nouveau_mot_de_passe}
                                            onChange={e => setPwdData({...pwdData, nouveau_mot_de_passe: e.target.value})}
                                            className="w-full border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base py-3 shadow-sm transition mb-4" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirmer le mot de passe</label>
                                        <input 
                                            type="password" 
                                            value={pwdData.nouveau_mot_de_passe_confirmation}
                                            onChange={e => setPwdData({...pwdData, nouveau_mot_de_passe_confirmation: e.target.value})}
                                            className="w-full border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base py-3 shadow-sm transition" 
                                            required 
                                        />
                                    </div>
                                    <div className="mt-4 flex items-start gap-2 text-orange-600">
                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] font-medium leading-tight">Le mot de passe doit comporter au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-orange-500 text-white px-6 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition shadow-md disabled:opacity-70"
                                    >
                                        <Lock size={18} /> Mettre à jour mon mot de passe
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Profil;
