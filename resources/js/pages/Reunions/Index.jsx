import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { Calendar, Video, CheckCircle, Plus, Clock } from 'lucide-react';
import ModalCreateReunion from '../Demandes/ModalCreateReunion';

const Reunions = () => {
    const [reunions, setReunions] = useState([]);
    const [demandesReunion, setDemandesReunion] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModalReunion, setShowModalReunion] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isChef = ['Chef de projet', 'Gestionnaire', 'Gestionnaire de projet', 'Superviseur', 'Administrateur', 'Administrateur système'].includes(currentUser?.fonction);
    const canOrganize = !['Administrateur', 'Administrateur système'].includes(currentUser?.fonction);

    const fetchData = async () => {
        try {
            const [resReunions, resDemandesReunion, resUtils, resProjets] = await Promise.all([
                api.get('/api/reunions/mes-reunions'),
                isChef ? api.get('/api/reunions/demandes') : Promise.resolve({ data: [] }),
                api.get('/api/utilisateurs'),
                api.get('/api/projets')
            ]);
            setReunions(Array.isArray(resReunions.data) ? resReunions.data : (resReunions.data.data || []));
            setDemandesReunion(Array.isArray(resDemandesReunion.data) ? resDemandesReunion.data : (resDemandesReunion.data.data || []));
            setUtilisateurs(Array.isArray(resUtils.data) ? resUtils.data : (resUtils.data.data || []));
            setProjets(Array.isArray(resProjets.data) ? resProjets.data : (resProjets.data.data || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (!loading && window.location.hash) {
            const id = window.location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Petit effet visuel pour mettre en valeur
                    element.classList.add('ring-2', 'ring-[#0564A8]', 'ring-offset-2');
                    setTimeout(() => element.classList.remove('ring-2', 'ring-[#0564A8]', 'ring-offset-2'), 2000);
                }, 100);
            }
        }
    }, [loading, reunions, demandesReunion]);

    const handleValiderReunion = async (id) => {
        try {
            await api.patch(`/api/reunions/${id}/valider`);
            fetchData();
        } catch (e) {
            alert('Erreur lors de la validation');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Chargement des réunions...</div>;

    const now = new Date();
    
    // Helper pour savoir si une réunion est passée (en fonction de sa FIN)
    const isPast = (r) => {
        if (r.statut === 'terminee') return true;
        const endDate = new Date(r.date_reunion);
        endDate.setMinutes(endDate.getMinutes() + (r.duree_minutes || 60)); // Par défaut 60 min si non défini
        return endDate < now;
    };
    
    // Réunions à venir : FIN dans le futur ET non marquées comme terminées
    // Triées de la plus proche (bientôt) à la plus éloignée (plus tard)
    const reunionsPlanifiees = reunions
        .filter(r => !isPast(r))
        .sort((a, b) => new Date(a.date_reunion) - new Date(b.date_reunion));

    // Réunions passées : FIN dans le passé OU marquées comme terminées
    // Triées de la plus récente (hier) à la plus ancienne (l'année dernière)
    const reunionsTerminees = reunions
        .filter(r => isPast(r))
        .sort((a, b) => new Date(b.date_reunion) - new Date(a.date_reunion));

    const totalReunions = reunionsPlanifiees.length + demandesReunion.length;

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Réunions</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">
                        {totalReunions} réunion(s) à venir ou en attente
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canOrganize && (
                        <button onClick={() => setShowModalReunion(true)} className="bg-[#0564A8] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#044c80] transition">
                            <Plus size={16} /> {isChef ? 'Planifier une réunion' : 'Demander une réunion'}
                        </button>
                    )}
                </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                
                {/* Réunions planifiées */}
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-800 text-lg border-b pb-2">À venir ({reunionsPlanifiees.length})</h2>
                    {reunionsPlanifiees.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucune réunion à venir.</p>
                    ) : (
                        reunionsPlanifiees.map(r => (
                            <div key={r.id} id={`reunion-${r.id}`} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition scroll-mt-24">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-2 items-center">
                                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Planifiée</span>
                                            {r.projet && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">{r.projet.titre}</span>}
                                        </div>
                                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Video size={12} /> {r.lieu || 'Non spécifié'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">{r.titre}</h3>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar size={14} className="text-[#0564A8]" /> {new Date(r.date_reunion).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Organisée par {r.organisateur?.prenom} {r.organisateur?.nom} ({r.organisateur?.fonction})
                                    </p>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-600">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ordre du jour</p>
                                        <p>{r.ordre_du_jour}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Réunions terminées */}
                {reunionsTerminees.length > 0 && (
                    <div className="space-y-4 mt-8 pt-8 border-t-2 border-dashed border-gray-200">
                        <h2 className="font-bold text-gray-500 text-lg border-b border-gray-200 pb-2 flex items-center gap-2">
                            <CheckCircle size={18} /> Terminées ({reunionsTerminees.length})
                        </h2>
                        {reunionsTerminees.map(r => (
                            <div key={r.id} id={`reunion-${r.id}`} className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200 shadow-none flex flex-col justify-between opacity-75 scroll-mt-24 grayscale-[30%]">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-2 items-center">
                                            <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle size={12} /> Terminée
                                            </span>
                                            {r.projet && <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">{r.projet.titre}</span>}
                                        </div>
                                        <span className="bg-gray-200 text-gray-500 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Video size={12} /> {r.lieu || 'Non spécifié'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-600 leading-tight mb-2 line-through decoration-gray-300">{r.titre}</h3>
                                    <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                                        <Calendar size={14} className="text-gray-400" /> {new Date(r.date_reunion).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Organisée par {r.organisateur?.prenom} {r.organisateur?.nom} ({r.organisateur?.fonction})
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Demandes de réunion à valider (pour les chefs) */}
                {isChef && demandesReunion.length > 0 && (
                    <div className="space-y-4 mt-8 pt-8 border-t border-dashed border-gray-200">
                        <h2 className="font-bold text-orange-600 text-lg border-b border-orange-100 pb-2">À valider ({demandesReunion.length})</h2>
                        {demandesReunion.map(r => (
                            <div key={r.id} id={`demande-${r.id}`} className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm bg-orange-50/10 flex flex-col justify-between scroll-mt-24">
                                <div>
                                    <div className="flex gap-2 mb-3 items-center">
                                        <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> En attente</span>
                                        {r.projet && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">{r.projet.titre}</span>}
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">{r.titre}</h3>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar size={14} className="text-orange-500" /> {new Date(r.date_reunion).toLocaleString('fr-FR')}
                                    </p>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Demandée par {r.organisateur?.prenom} {r.organisateur?.nom} ({r.organisateur?.fonction})
                                    </p>
                                    <div className="bg-white p-3 rounded-xl border border-orange-100 text-sm text-gray-600">
                                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Ordre du jour</p>
                                        <p>{r.ordre_du_jour}</p>
                                    </div>
                                </div>
                                <div className="border-t border-orange-100 pt-4 mt-4">
                                    <button onClick={() => handleValiderReunion(r.id)} className="w-auto px-6 bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 flex items-center justify-center gap-2">
                                        <CheckCircle size={16} /> Valider la planification
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modales */}
            {showModalReunion && <ModalCreateReunion isChef={isChef} onClose={() => setShowModalReunion(false)} onSuccess={() => {setShowModalReunion(false); fetchData();}} utilisateurs={utilisateurs} projets={projets} />}
        </div>
    );
};

export default Reunions;
