import React, { useState } from 'react';
import { Palette, Layout, Moon, Sun, Monitor, MonitorSmartphone, Save } from 'lucide-react';

const Personnalisation = () => {
    const [theme, setTheme] = useState('system');
    const [color, setColor] = useState('blue');

    const colors = [
        { id: 'blue', name: 'Bleu ISFAD', class: 'bg-[#0564A8]' },
        { id: 'indigo', name: 'Indigo', class: 'bg-indigo-600' },
        { id: 'emerald', name: 'Émeraude', class: 'bg-emerald-500' },
        { id: 'orange', name: 'Orange', class: 'bg-orange-500' },
        { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Personnalisation</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Adaptez l'apparence de l'application à vos goûts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#044c80] transition">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto p-8">
                
                {/* Thème */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                        <MonitorSmartphone size={20} className="text-[#0564A8]" /> Thème global
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div 
                            onClick={() => setTheme('light')}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === 'light' ? 'border-[#0564A8] bg-[#0564A8]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Sun size={24} className={theme === 'light' ? 'text-[#0564A8]' : 'text-gray-400'} />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'light' ? 'border-[#0564A8]' : 'border-gray-300'}`}>
                                    {theme === 'light' && <div className="w-2 h-2 bg-[#0564A8] rounded-full"></div>}
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800">Clair</h4>
                            <p className="text-xs text-gray-500 mt-1">Apparence lumineuse standard.</p>
                        </div>
                        <div 
                            onClick={() => setTheme('dark')}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === 'dark' ? 'border-[#0564A8] bg-[#0564A8]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Moon size={24} className={theme === 'dark' ? 'text-[#0564A8]' : 'text-gray-400'} />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'dark' ? 'border-[#0564A8]' : 'border-gray-300'}`}>
                                    {theme === 'dark' && <div className="w-2 h-2 bg-[#0564A8] rounded-full"></div>}
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800">Sombre</h4>
                            <p className="text-xs text-gray-500 mt-1">Protège vos yeux dans l'obscurité.</p>
                        </div>
                        <div 
                            onClick={() => setTheme('system')}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === 'system' ? 'border-[#0564A8] bg-[#0564A8]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Monitor size={24} className={theme === 'system' ? 'text-[#0564A8]' : 'text-gray-400'} />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'system' ? 'border-[#0564A8]' : 'border-gray-300'}`}>
                                    {theme === 'system' && <div className="w-2 h-2 bg-[#0564A8] rounded-full"></div>}
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800">Système</h4>
                            <p className="text-xs text-gray-500 mt-1">S'adapte à votre système d'exploitation.</p>
                        </div>
                    </div>
                </div>

                {/* Couleur d'accentuation */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                        <Palette size={20} className="text-orange-500" /> Couleur d'accentuation
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Choisissez la couleur principale utilisée pour les boutons et les liens importants.</p>
                    <div className="flex flex-wrap gap-4">
                        {colors.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setColor(c.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${color === c.id ? 'border-gray-800' : 'border-transparent hover:bg-gray-50'}`}
                            >
                                <div className={`w-5 h-5 rounded-full ${c.class}`}></div>
                                <span className="text-sm font-bold text-gray-700">{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Disposition */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                        <Layout size={20} className="text-emerald-500" /> Disposition
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Menu latéral condensé</p>
                            <p className="text-xs text-gray-500 mt-1">Réduit la largeur du menu latéral pour laisser plus de place au contenu.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0564A8]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0564A8]"></div>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Personnalisation;
