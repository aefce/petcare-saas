import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Account {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  department?: string;
  name?: string;
  is_member?: boolean;
  phone?: string;
}

interface AuthState {
  token: string | null;
  account: Account | null;
  setAuth: (token: string, account: Account) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      account: null,
      setAuth: (token, account) => set({ token, account }),
      clearAuth: () => set({ token: null, account: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'petcare-auth-storage', // localStorage key
    }
  )
);
