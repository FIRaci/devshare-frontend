import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Interface User phải có is_staff
interface User {
  id: number;
  username: string;
  is_staff: boolean;
  profile?: {
    bio: string;
    avatar: string;
  };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (tokens: { access: string; refresh: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (tokens) => {
        set({ accessToken: tokens.access, refreshToken: tokens.refresh });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Xóa luôn dữ liệu query cũ để đảm bảo không bị cache
        // queryClient.clear();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Chỉ lưu token, không lưu user để đảm bảo dữ liệu user luôn mới
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
