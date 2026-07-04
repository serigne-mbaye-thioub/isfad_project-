import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, PlayCircle } from 'lucide-react';
import api from '../axios';
import ModalDetailTache from './ModalDetailTache';

const STATUSES = [
    { id: 'a_faire', label: 'À faire', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <AlertCircle size={14} /> },
    { id: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-[#0564A8] border-blue-200', icon: <PlayCircle size={14} /> },
    { id: 'en_revision', label: 'En révision', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock size={14} /> },
    { id: 'terminee', label: 'Terminée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
];

const KanbanTask = ({ task, onClick, onStatutChange, currentUser }) => {
    // Calcul de retard
    const isRetard = new Date() > new Date(task.date_limite) && !['terminee', 'archivee'].includes(task.statut);
    
    // Permission de changer le statut (R ou A)
    const peutChangerStatut = task.responsable?.id === currentUser?.id || task.approbateur?.id === currentUser?.id;

    return (
        <div 
            draggable={peutChangerStatut}
            onDragStart={(e) => {
                if (peutChangerStatut) {
                    e.dataTransfer.setData('taskId', task.id);
                }
            }}
            onClick={() => onClick(task)}
            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer group relative ${isRetard ? 'border-l-4 border-l-red-500' : ''} ${peutChangerStatut ? 'hover:shadow-md hover:border-blue-200 cursor-grab active:cursor-grabbing' : 'opacity-80'}`}
        >
            {isRetard && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-red-500 text-white p-1 rounded-full shadow-sm" title="En retard">
                    <AlertTriangle size={12} />
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    task.priorite === 'critique' ? 'bg-red-50 text-red-600 border-red-200' :
                    task.priorite === 'haute' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                    {task.priorite}
                </span>
                
                {peutChangerStatut && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <select 
                            className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={task.statut}
                            onChange={(e) => onStatutChange(task.id, e.target.value)}
                        >
                            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <h4 className="text-sm font-bold text-gray-900 leading-tight mb-3 line-clamp-2">{task.titre}</h4>

            <div className="flex items-center justify-between mt-auto">
                {/* R et A visuels */}
                <div className="flex -space-x-1">
                    {task.responsable && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white" title={`R: ${task.responsable.prenom} ${task.responsable.nom}`}>
                            {task.responsable.prenom[0]}{task.responsable.nom[0]}
                        </div>
                    )}
                    {task.racis?.filter(r => r.role_raci === 'consulte').map((raci, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white" title={`C: ${raci.utilisateur?.prenom} ${raci.utilisateur?.nom}`}>
                            {raci.utilisateur?.prenom?.[0]}{raci.utilisateur?.nom?.[0]}
                        </div>
                    ))}
                </div>

                <div className={`flex items-center gap-1 text-[10px] font-semibold ${isRetard ? 'text-red-500' : 'text-gray-400'}`}>
                    <Clock size={12} />
                    {new Date(task.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ status, tasks, onTaskClick, onStatutChange, currentUser }) => {
    return (
        <div 
            className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 w-[300px] flex-shrink-0"
            onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-blue-50/50', 'border-blue-200');
            }}
            onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-50/50', 'border-blue-200');
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-blue-50/50', 'border-blue-200');
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId) {
                    onStatutChange(taskId, status.id);
                }
            }}
        >
            <div className={`flex items-center justify-between p-4 border-b border-gray-100 rounded-t-2xl bg-white`}>
                <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${status.color}`}>
                        {status.icon}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 tracking-wide">{status.label}</h3>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {tasks.length}
                </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                {tasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-300 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl py-8">
                        Aucune tâche
                    </div>
                ) : (
                    tasks.map(task => (
                        <KanbanTask 
                            key={task.id} 
                            task={task} 
                            onClick={onTaskClick}
                            onStatutChange={onStatutChange}
                            currentUser={currentUser}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const KanbanBoard = ({ taches = [], onTaskUpdate, currentUser }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    const handleStatutChange = async (taskId, newStatut) => {
        try {
            await api.patch(`/api/taches/${taskId}/statut`, { statut: newStatut });
            onTaskUpdate(); // Rafraîchir les données parentes
        } catch (e) {
            alert(e.response?.data?.message || 'Erreur lors du changement de statut');
        }
    };

    return (
        <>
            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 -mx-2 px-2 items-start">
                {STATUSES.map(status => {
                    const columnTasks = taches.filter(t => t.statut === status.id);
                    return (
                        <KanbanColumn
                            key={status.id}
                            status={status}
                            tasks={columnTasks}
                            onTaskClick={setSelectedTask}
                            onStatutChange={handleStatutChange}
                            currentUser={currentUser}
                        />
                    );
                })}
            </div>

            {selectedTask && (
                <ModalDetailTache task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </>
    );
};

export default KanbanBoard;
