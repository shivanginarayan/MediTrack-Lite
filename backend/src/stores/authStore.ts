import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, type User, type LoginCredentials, DEMO_CREDENTIALS } from '../lib/auth';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        if (USE_MOCKS) {
          // Mock authentication for demo
          await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
          
          const validCredentials = [
            { email: 'admin@meditrack-demo.com', password: 'demo123', role: 'admin' },
            { email: 'lead@meditrack-demo.com', password: 'demo123', role: 'lead' },
            { email: 'staff@meditrack-demo.com', password: 'demo123', role: 'staff' }
          ]
          
          const credential = validCredentials.find(c => c.email === email && c.password === password)
          
          if (credential) {
            const mockUser = {
              id: '1',
              email: credential.email,
              name: credential.role.charAt(0).toUpperCase() + credential.role.slice(1) + ' User',
              role: credential.role,
              avatar: undefined
            }
            
            set({ 
              user: mockUser,
              token: 'mock-jwt-token-' + Date.now(),
              isAuthenticated: true, 
              isLoading: false,
              error: null
            });
          } else {
            throw new Error('Invalid credentials')
          }
        } else {
          // Real API authentication
          const credentials: LoginCredentials = { email, password };
          const response = await authAPI.login(credentials);
          
          set({ 
            user: response.user,
            token: response.token,
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        set({ 
          error: errorMessage,
          isLoading: false,
          user: null,
          token: null,
          isAuthenticated: false
        });
        throw error;
      }
    },

    logout: async () => {
      const { token } = get();
      
      try {
        if (token) {
          await authAPI.logout(token);
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({ 
          user: null,
          token: null,
          isAuthenticated: false, 
          error: null 
        });
      }
    },

    refreshToken: async () => {
      const { token } = get();
      
      if (!token) return;
      
      try {
        const response = await authAPI.refreshToken(token);
        set({ token: response.token });
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        get().logout();
      }
    },

    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ 
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated 
    }),
  }
));

// Export demo credentials for easy access
export { DEMO_CREDENTIALS };