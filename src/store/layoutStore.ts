import { create } from 'zustand';

interface LayoutState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarOpen: true, // Mặc định là hiện
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

export default useLayoutStore;
