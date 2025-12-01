import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Login user
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.post(`${apiConfig.baseURL}/auth/login`, { email, password });
          
          const { token, user } = response.data;
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          set({ 
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response.data;
        } catch (err) {
          set({ 
            isLoading: false, 
            error: err.response?.data?.message || 'Failed to login' 
          });
          throw err;
        }
      },
      
      // Logout user
      logout: () => {
        localStorage.removeItem('token');
        set({ 
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },
      
      // Load user data from token
      loadUser: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        try {
          set({ isLoading: true });
          const response = await axios.get(`${apiConfig.baseURL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          set({ 
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
            token
          });
          
          return response.data.data;
        } catch (err) {
          localStorage.removeItem('token');
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: err.response?.data?.message || 'Failed to load user'
          });
        }
      },
      
      // Register new user
      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.post(`${apiConfig.baseURL}/auth/register`, userData);
          
          // Don't auto-login after registration
          set({ isLoading: false });
          
          return response.data;
        } catch (err) {
          set({ 
            isLoading: false, 
            error: err.response?.data?.message || 'Failed to register'
          });
          throw err;
        }
      },
      
      // Reset loading and error state
      clearErrors: () => set({ error: null }),
      clearState: () => set({ error: null, isLoading: false }),
    }),
    {
      name: 'sinosply-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
); 