import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ModalAlert = ({ isOpen, title = "Information", message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold">{title}</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {message}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            Compris
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAlert;
