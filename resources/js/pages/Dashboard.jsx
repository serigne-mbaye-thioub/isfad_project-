import React from 'react';

const Dashboard = () => {
    return (
        <div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-t-4 border-[#0564A8]">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue dans l'espace sécurisé !</h2>
                <p className="text-gray-600 mb-6">L'authentification Laravel Sanctum fonctionne parfaitement. Vous êtes connecté.</p>
                
                <div className="bg-blue-50 text-[#0564A8] p-4 rounded-md border border-blue-100 text-sm font-medium">
                    Prochaine étape : Intégrer les vues "Projets" et "Kanban" avec l'architecture en poupées russes (Phases &gt; Activités &gt; Tâches).
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
