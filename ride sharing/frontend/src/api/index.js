import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api',
});

API.interceptors.request.use((req) => {
    const token = JSON.parse(localStorage.getItem('auth-storage'))?.state?.token;
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;
