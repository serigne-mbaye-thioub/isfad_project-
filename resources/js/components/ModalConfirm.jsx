import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ModalConfirm = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler", type = "warning" }) => {
    if (!isOpen) return null;

    const colors = {
        warning: {
            icon: <AlertTriangle size={24} className="text-amber-600" />,
            bg: "bg-amber-50",
            button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        },
        danger: {
            icon: <AlertTriangle size={24} className="text-red-600" />,
            bg: "bg-red-50",
            button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        },
        primary: {
            icon: <AlertTriangle size={24} className="text-[#0564A8]" />,
            bg: "bg-blue-50",
            button: "bg-[#0564A8] hover:bg-[#044c80] focus:ring-[#0564A8]",
        }
    };

    const config = colors[type] || colors.warning;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 p-3 rounded-full ${config.bg}`}>
                            {config.icon}
                        </div>
                        <div className="flex-1 mt-1">
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-white font-bold rounded-xl transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirm;
