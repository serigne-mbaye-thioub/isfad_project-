import React from 'react';
import { X, Clock, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react';

const STATUS_MAP = {
    'a_faire': { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
    'en_cours': { label: 'En cours', color: 'bg-blue-100 text-[#0564A8]' },
    'en_revision': { label: 'En révision', color: 'bg-orange-100 text-orange-700' },
    'terminee': { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700' },
};

const PRIORITE_MAP = {
    'basse': 'bg-gray-100 text-gray-700',
    'moyenne': 'bg-gray-100 text-gray-700',
    'haute': 'bg-orange-100 text-orange-700',
    'critique': 'bg-red-100 text-red-700',
};

const UserBadge = ({ user, role, bgColor }) => {
    if (!user) return null;
    return (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className={`w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">{role}</p>
            </div>
        </div>
    );
};

const ModalDetailTache = ({ task, onClose }) => {
    if (!task) return null;

    const consultes = task.racis?.filter(r => r.role_raci === 'consulte').map(r => r.utilisateur) || [];
    const informes = task.racis?.filter(r => r.role_raci === 'informe').map(r => r.utilisateur) || [];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
                    <div className="pr-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${PRIORITE_MAP[task.priorite] || PRIORITE_MAP['moyenne']}`}>
                                Priorité: {task.priorite}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_MAP[task.statut]?.color}`}>
                                {STATUS_MAP[task.statut]?.label}
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-[#0564A8] leading-tight">{task.titre}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 min-h-[60px]">
                            {task.description || <span className="italic text-gray-400">Aucune description fournie.</span>}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date de début</p>
                            <p className="text-sm font-semibold text-gray-900">{new Date(task.date_debut).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date Limite</p>
                            <p className={`text-sm font-semibold flex items-center gap-1 ${new Date(task.date_limite) < new Date() && task.statut !== 'terminee' ? 'text-red-600' : 'text-gray-900'}`}>
                                <Clock size={14} />
                                {new Date(task.date_limite).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    {/* Matrice RACI */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Matrice RACI</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Responsable & Approbateur */}
                            <div className="space-y-3">
                                {task.responsable ? (
                                    <UserBadge user={task.responsable} role="Responsable (R)" bgColor="bg-blue-600" />
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-2">Aucun responsable</div>
                                )}
                                
                                {task.approbateur && (
                                    <UserBadge user={task.approbateur} role="Approbateur (A)" bgColor="bg-purple-600" />
                                )}
                            </div>

                            {/* Consultés & Informés */}
                            <div className="space-y-4">
                                {consultes.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Consultés (C)</p>
                                        <div className="flex flex-wrap gap-2">
                                            {consultes.map(u => (
                                                <div key={`c-${u.id}`} className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-medium" title={`${u.prenom} ${u.nom}`}>
                                                    {u.prenom} {u.nom}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {informes.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Informés (I)</p>
                                        <div className="flex flex-wrap gap-2">
                                            {informes.map(u => (
                                                <div key={`i-${u.id}`} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-medium" title={`${u.prenom} ${u.nom}`}>
                                                    {u.prenom} {u.nom}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ModalDetailTache;
