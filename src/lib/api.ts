import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Using relative URL to go through Vite proxy
    withCredentials: true, // Important for cookies (JWT)
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
