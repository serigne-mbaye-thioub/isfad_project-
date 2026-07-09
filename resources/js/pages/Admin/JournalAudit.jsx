import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { Search, ShieldAlert, Clock, User } from 'lucide-react';

const JournalAudit = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const res = await api.get('/api/admin/audits');
                setAudits(res.data.data || res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse">Chargement du journal d'audit...</div>;

    const filteredAudits = audits.filter(a => 
        (a.action || '').toLowerCase().includes(search.toLowerCase()) || 
        (a.type_element || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.utilisateur && `${a.utilisateur.prenom} ${a.utilisateur.nom}`.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Journal d'Audit</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Historique complet de toutes les actions effectuées sur la plateforme.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher une action..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#0564A8]/20 focus:border-[#0564A8] transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="p-4 font-bold w-1/4">Horodatage</th>
                                <th className="p-4 font-bold w-1/4">Utilisateur</th>
                                <th className="p-4 font-bold w-1/4">Action</th>
                                <th className="p-4 font-bold w-1/4">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAudits.map((audit) => (
                                <tr key={audit.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                            <Clock size={14} className="text-gray-400" />
                                            {new Date(audit.created_at).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {audit.utilisateur ? (
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                                <User size={14} className="text-[#0564A8]" />
                                                {audit.utilisateur.prenom} {audit.utilisateur.nom}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Système</span>
                                        )}
                                        <div className="text-[10px] text-gray-400 mt-0.5 ml-6">IP: {audit.ip_adresse || 'Inconnue'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {audit.action}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs text-gray-600">
                                            {audit.type_element && <span className="font-semibold">{audit.type_element} #{audit.id_element} — </span>}
                                            {audit.nouvelles_valeurs ? JSON.stringify(audit.nouvelles_valeurs).slice(0, 100) : 'Aucun détail'}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {filteredAudits.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-400 text-sm">Aucune trace d'audit trouvée.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JournalAudit;
