import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,

  setUser: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const user = { id: data.user._id, role: data.user.role }; // adjust to backend response
    console.log('user logged in:', data);

    // 🔑 persist token
    localStorage.setItem('token', data.token);

    set({ user, token: data.token });
    return user;
  },

  register: async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    const user = { id: data.id, role: data.role };

    // 🔑 persist token
    localStorage.setItem('token', data.token);

    set({ user, token: data.token });
    return user;
  },
}));
