import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axios';

export default function RapportRedirector() {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/api/rapports/${id}`).then(res => {
            const rapport = res.data;
            if (rapport.type_cible === 'projet' && rapport.id_cible) {
                // Redirige vers le projet avec le tab rapports et le rapport cible
                navigate(`/projets/${rapport.id_cible}#rapport-${id}`, { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }).catch(() => {
            navigate('/dashboard', { replace: true });
        });
    }, [id, navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#0564A8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Ouverture du rapport...</p>
            </div>
        </div>
    );
}
