import axios from 'axios';

// Use environment variable for production, fallback to proxy for development
const getBaseURL = () => {
    // In production, use the full backend URL
    if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // In development, use relative URL to go through Vite proxy
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true, // Important for cookies (JWT)
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
