import axios from 'axios';

// baseURL intentionnellement vide : le proxy Vite (vite.config.js) redirige
// /api et /sanctum vers http://localhost:8000 → même origine → pas de CORS
const api = axios.create({
    baseURL: '',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Intercepteur : injecter le token Bearer stocké dans localStorage si présent
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur réponse : gérer les 401 proprement
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
