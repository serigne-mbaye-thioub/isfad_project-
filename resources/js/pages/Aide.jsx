import React from 'react';
import { HelpCircle, Book, MessageSquare, PhoneCall, ExternalLink, Search } from 'lucide-react';

const Aide = () => {
    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Aide & Support</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Trouvez des réponses à vos questions ou contactez l'assistance.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto p-8">
                
                {/* Search Bar */}
                <div className="relative mb-10">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Comment pouvons-nous vous aider ?" 
                        className="w-full pl-12 border-2 border-gray-200 rounded-xl focus:border-[#0564A8] focus:ring-[#0564A8] py-4 text-base shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl hover:shadow-md transition cursor-pointer group">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Book size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Documentation</h3>
                        <p className="text-sm text-gray-500 mb-4">Consultez les guides d'utilisation détaillés pour comprendre le fonctionnement de l'application.</p>
                        <span className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:underline">Parcourir les guides <ExternalLink size={14} /></span>
                    </div>

                    <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-2xl hover:shadow-md transition cursor-pointer group">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <HelpCircle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">FAQ</h3>
                        <p className="text-sm text-gray-500 mb-4">Questions fréquemment posées par les utilisateurs de la plateforme ISFAD Gouvernance.</p>
                        <span className="text-orange-600 text-sm font-bold flex items-center gap-1 group-hover:underline">Voir les questions fréquentes <ExternalLink size={14} /></span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6">Contactez l'assistance technique</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Support par e-mail</p>
                            <p className="text-sm text-gray-500">support@isfad.com</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                            <PhoneCall size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">Assistance téléphonique</p>
                            <p className="text-sm text-gray-500">+221 33 000 00 00</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Aide;
