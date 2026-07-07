import React, { useEffect, useState } from 'react';
import api from '../axios';
import { Calendar, Video, Clock, Users, Plus, CheckCircle, XCircle } from 'lucide-react';

const ModalCreateReunion = ({ onClose, onSuccess, utilisateurs, projets }) => {
    const [formData, setFormData] = useState({ 
        titre: '', ordre_du_jour: '', lieu: '', 
        date_reunion: '', duree_minutes: 60, id_projet: '', participants: [] 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/reunions', {
                ...formData,
                id_projet: formData.id_projet || null
            });
            onSuccess();
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors de la création de la réunion');
        } finally {
            setLoading(false);
        }
    };

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(id) 
                ? prev.participants.filter(p => p !== id) 
                : [...prev.participants, id]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#0564A8]" /> Planifier une réunion</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Titre</label>
                            <input type="text" required className="w-full border rounded-lg p-2 text-sm" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Projet lié (Optionnel)</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={formData.id_projet} onChange={e => setFormData({...formData, id_projet: e.target.value})}>
                                <option value="">Aucun projet</option>
                                {projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Ordre du jour</label>
                        <textarea required rows="3" className="w-full border rounded-lg p-2 text-sm" value={formData.ordre_du_jour} onChange={e => setFormData({...formData, ordre_du_jour: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Date et Heure</label>
                            <input type="datetime-local" required className="w-full border rounded-lg p-2 text-sm" value={formData.date_reunion} onChange={e => setFormData({...formData, date_reunion: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Durée (minutes)</label>
                            <input type="number" required min="15" step="15" className="w-full border rounded-lg p-2 text-sm" value={formData.duree_minutes} onChange={e => setFormData({...formData, duree_minutes: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Lieu ou Lien Visio</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})} placeholder="Salle A ou Zoom" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">Sélectionner les participants</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2">
                            {utilisateurs.map(u => (
                                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input type="checkbox" checked={formData.participants.includes(u.id)} onChange={() => toggleParticipant(u.id)} className="rounded text-[#0564A8] focus:ring-[#0564A8]" />
                                    <span>{u.prenom} {u.nom}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold">Annuler</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0564A8] text-white rounded-lg text-sm font-bold">Planifier</button>
                </div>
            </form>
        </div>
    );
};

const Reunions = () => {
    const [reunions, setReunions] = useState([]);
    const [demandes, setDemandes] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('mes_reunions');

    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isChef = ['Chef de projet', 'Gestionnaire de projet', 'Superviseur'].includes(currentUser?.fonction);
    const canOrganize = !['Administrateur', 'Administrateur système'].includes(currentUser?.fonction);

    const fetchData = async () => {
        try {
            const [resReunions, resDemandes, resUtils, resProjets] = await Promise.all([
                api.get('/api/reunions/mes-reunions'),
                isChef ? api.get('/api/reunions/demandes') : Promise.resolve({ data: [] }),
                api.get('/api/utilisateurs'),
                api.get('/api/projets')
            ]);
            setReunions(resReunions.data);
            setDemandes(resDemandes.data);
            setUtilisateurs(resUtils.data);
            setProjets(resProjets.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleValider = async (id) => {
        try {
            await api.patch(`/api/reunions/${id}/valider`);
            fetchData();
        } catch (e) {
            alert('Erreur lors de la validation');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Chargement des réunions...</div>;

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Réunions & Événements</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Gérez vos réunions, comités et points de synchronisation.</p>
                </div>
                {canOrganize && (
                    <button onClick={() => setShowModal(true)} className="bg-[#0564A8] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
                        <Plus size={18} /> Organiser une réunion
                    </button>
                )}
            </div>

            {isChef && (
                <div className="flex gap-6 border-b border-gray-200 mb-6 flex-shrink-0 px-2">
                    <button 
                        onClick={() => setActiveTab('mes_reunions')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'mes_reunions' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                    >
                        Mes réunions planifiées <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{reunions.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('demandes')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'demandes' ? 'border-[#0564A8] text-[#0564A8]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                    >
                        Demandes à valider <span className={`${demandes.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded-full text-xs`}>{demandes.length}</span>
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'mes_reunions' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {reunions.map(r => (
                            <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-2">
                                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Planifiée</span>
                                            {r.projet && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">{r.projet.titre}</span>}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                            <Video size={14} /> {r.lieu || 'Non spécifié'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">{r.titre}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{r.ordre_du_jour}</p>
                                </div>
                                
                                <div className="flex justify-between items-end border-t border-gray-50 pt-4 mt-auto">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date & Heure</p>
                                        <p className="text-sm font-black text-gray-900 flex items-center gap-1">
                                            <Calendar size={14} className="text-[#0564A8]" /> {new Date(r.date_reunion).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Organisateur</p>
                                        <p className="text-sm font-bold text-gray-700">{r.organisateur?.prenom} {r.organisateur?.nom}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {reunions.length === 0 && (
                            <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                Vous n'avez aucune réunion planifiée.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {demandes.map(r => (
                            <div key={r.id} className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm bg-orange-50/10 flex flex-col justify-between">
                                <div>
                                    <div className="flex gap-2 mb-3">
                                        <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">En attente de validation</span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">{r.titre}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{r.ordre_du_jour}</p>
                                    <p className="text-xs text-gray-500 mb-4">
                                        <strong>Date prévue :</strong> {new Date(r.date_reunion).toLocaleString('fr-FR')} <br/>
                                        <strong>Demandée par :</strong> {r.organisateur?.prenom} {r.organisateur?.nom}
                                    </p>
                                </div>
                                <div className="border-t border-orange-100 pt-4 mt-auto">
                                    <button onClick={() => handleValider(r.id)} className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 flex items-center justify-center gap-2">
                                        <CheckCircle size={16} /> Valider la planification
                                    </button>
                                </div>
                            </div>
                        ))}
                        {demandes.length === 0 && (
                            <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                Aucune demande de réunion en attente.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showModal && <ModalCreateReunion onClose={() => setShowModal(false)} onSuccess={() => {setShowModal(false); fetchData();}} utilisateurs={utilisateurs} projets={projets} />}
        </div>
    );
};

export default Reunions;
