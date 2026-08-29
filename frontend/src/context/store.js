import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  isAuthenticated: () => !!localStorage.getItem('token'),
}));

export const useIncidentStore = create((set, get) => ({
  incidents: [],
  currentIncident: null,
  isLoading: false,
  error: null,
  statistics: null,

  setIncidents: (incidents) => set({ incidents }),
  setCurrentIncident: (incident) => set({ currentIncident: incident }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setStatistics: (statistics) => set({ statistics }),

  addIncident: (incident) =>
    set((state) => ({
      incidents: [incident, ...state.incidents],
    })),

  updateIncident: (id, updates) =>
    set((state) => ({
      incidents: state.incidents.map((incident) =>
        incident._id === id ? { ...incident, ...updates } : incident
      ),
    })),

  clearError: () => set({ error: null }),
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { id: Date.now(), ...notification },
        ...state.notifications,
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));

export const useUIStore = create((set) => ({
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  isSidebarOpen: true,
  
  toggleDarkMode: () =>
    set((state) => {
      const newValue = !state.isDarkMode;
      localStorage.setItem('darkMode', newValue);
      return { isDarkMode: newValue };
    }),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));

export default {
  useAuthStore,
  useIncidentStore,
  useNotificationStore,
  useUIStore,
};
