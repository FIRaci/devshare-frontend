import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HiddenPostsState {
  hidePost: any;
  hiddenPostIds: number[];
  addHiddenPost: (id: number) => void;
}

const useHiddenPostsStore = create<HiddenPostsState>()(
  persist(
    (set) => ({
      hiddenPostIds: [],
      addHiddenPost: (id) =>
        set((state) => ({ hiddenPostIds: [...state.hiddenPostIds, id] })),
    }),
    {
      name: 'hidden-posts-storage', // Tên key trong localStorage
    }
  )
);

export default useHiddenPostsStore;