import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import API from '../api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: true,
            error: null,

            checkAuth: async () => {
                const token = get().token;
                if (!token) {
                    set({ loading: false });
                    return;
                }
                try {
                    set({ loading: false });
                } catch (error) {
                    set({ user: null, token: null, loading: false });
                }
            },

            login: async (email, password, role) => {
                // 🔑 Clear any previous user session before loading a new one
                set({ user: null, token: null, loading: true, error: null });
                try {
                    const { data } = await API.post('/auth/login', { email, password, role });
                    set({ user: data, token: data.token, loading: false, error: null });
                    return data;
                } catch (error) {
                    set({ user: null, token: null, error: error.response?.data?.message || 'Login failed', loading: false });
                    throw error;
                }
            },

            googleLogin: async (credential, role, isAccessToken = false) => {
                // 🔑 Clear any previous user session before loading a new one
                set({ user: null, token: null, loading: true, error: null });
                try {
                    const { data } = await API.post('/auth/google', { token: credential, role, isAccessToken });
                    set({ user: data, token: data.token, loading: false, error: null });
                    return data;
                } catch (error) {
                    set({ user: null, token: null, error: error.response?.data?.message || 'Google Login failed', loading: false });
                    throw error;
                }
            },

            register: async (userData) => {
                // 🔑 Clear any previous user session before registering
                set({ user: null, token: null, loading: true, error: null });
                try {
                    const { data } = await API.post('/auth/register', userData);
                    set({ user: data, token: data.token, loading: false, error: null });
                    return data;
                } catch (error) {
                    set({ user: null, token: null, error: error.response?.data?.message || 'Registration failed', loading: false });
                    throw error;
                }
            },

            logout: () => {
                // 🔑 Fully wipe state AND localStorage so no stale data persists
                set({ user: null, token: null, error: null, loading: false });
                localStorage.removeItem('auth-storage');
            },

            setUser: (userData) => {
                set({ user: userData });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useAuthStore;
