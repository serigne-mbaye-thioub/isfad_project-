import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const ModalDecisionChangement = ({ onClose, onConfirm, statut }) => {
    const [commentaire, setCommentaire] = useState('');
    const [loading, setLoading] = useState(false);

    const isRefus = statut === 'refusee';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(statut, commentaire);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                        {isRefus ? <XCircle className="text-red-600" /> : <CheckCircle className="text-emerald-500" />}
                        {isRefus ? 'Refuser la demande' : 'Approuver la demande'}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        Vous êtes sur le point de <strong>{isRefus ? 'rejeter' : 'valider'}</strong> cette demande.
                        Souhaitez-vous ajouter une justification ou une proposition alternative ? (Optionnel)
                    </p>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1.5">
                            <MessageSquare size={14} /> Commentaire / Justification
                        </label>
                        <textarea 
                            rows="4" 
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[#0564A8] focus:border-[#0564A8]" 
                            value={commentaire} 
                            onChange={e => setCommentaire(e.target.value)} 
                            placeholder={isRefus ? "Ex: Impossible car le budget est dépassé. Je vous propose de..." : "Ex: Accordé, veuillez procéder..."} 
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={`px-4 py-2 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition ${isRefus ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        >
                            {loading ? 'Traitement...' : 'Confirmer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ModalDecisionChangement;
