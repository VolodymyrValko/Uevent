import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '../types';
import { tokenStorage } from '../services/api';
import { authService, usersService } from '../services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const tokens = await authService.login(email, password);
          tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
          await get().fetchMe();
          set({ isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        return authService.register(data);
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {

        } finally {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchMe: async () => {
        try {
          const user = await usersService.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'uevent-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);
