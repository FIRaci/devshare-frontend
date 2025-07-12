import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Profile {
  bio: string | null;
  avatar: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  profile: Profile;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: ({ accessToken, refreshToken, user }: { accessToken: string; refreshToken: string; user: User }) => void;
  logout: () => void;
  updateUserProfile: (profile: Profile) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      updateUserProfile: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, profile } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;