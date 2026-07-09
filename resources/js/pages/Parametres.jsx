import React from 'react';
import { Settings, Bell, Lock, Globe, Database, Save } from 'lucide-react';

const Parametres = () => {
    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Paramètres</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Configurez les préférences générales de l'application</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#044c80] transition">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Section Notifications */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Bell size={20} className="text-[#0564A8]" /> Notifications
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]" defaultChecked />
                                <span className="text-sm font-medium text-gray-700">Notifications par e-mail</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]" defaultChecked />
                                <span className="text-sm font-medium text-gray-700">Notifications push dans le navigateur</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-[#0564A8] rounded border-gray-300 focus:ring-[#0564A8]" />
                                <span className="text-sm font-medium text-gray-700">Rappels de réunions (1h avant)</span>
                            </label>
                        </div>
                    </div>

                    {/* Section Préférences Système */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Globe size={20} className="text-orange-500" /> Langue et Région
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Langue de l'interface</label>
                                <select className="w-full border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] text-sm py-2">
                                    <option>Français</option>
                                    <option>Anglais (English)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Fuseau horaire</label>
                                <select className="w-full border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] text-sm py-2">
                                    <option>Heure de Greenwich (GMT)</option>
                                    <option>Europe/Paris (GMT+1)</option>
                                    <option>Afrique/Dakar (GMT)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section Confidentialité */}
                    <div className="space-y-4 md:col-span-2 mt-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Lock size={20} className="text-emerald-500" /> Confidentialité
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                            <Database size={24} className="text-gray-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-gray-800">Partage des données de diagnostic</p>
                                <p className="text-xs text-gray-500 mt-1 mb-3">Autoriser l'envoi de données anonymes pour nous aider à améliorer l'application.</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0564A8]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0564A8]"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">Activé</span>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Parametres;
