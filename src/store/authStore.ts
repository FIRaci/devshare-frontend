import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  is_staff: boolean;
  profile?: {
    bio: string;
    avatar: string;
  };
}

// SỬA LỖI: Thêm lại updateUserProfile vào đây
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (tokens: { access: string; refresh: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateUserProfile: (profileData: Partial<User['profile']>) => void;
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
      },
      
      // SỬA LỖI: Thêm lại logic của hàm updateUserProfile
      updateUserProfile: (profileData) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile: {
                  ...state.user.profile!,
                  ...profileData,
                },
              }
            : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
