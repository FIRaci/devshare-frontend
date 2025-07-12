import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Định nghĩa state và các action
interface HiddenPostsState {
  hiddenPostIds: number[];
  hidePost: (id: number) => void;
}

// Tạo store với zustand và persist middleware để lưu vào localStorage
const useHiddenPostsStore = create<HiddenPostsState>()(
  persist(
    (set) => ({
      hiddenPostIds: [],
      
      // SỬA LỖI: Đổi tên hàm từ `addHiddenPost` thành `hidePost` để khớp với interface
      hidePost: (id: number) =>
        set((state) => ({
          // Thêm logic để tránh lưu trùng lặp ID
          hiddenPostIds: state.hiddenPostIds.includes(id)
            ? state.hiddenPostIds
            : [...state.hiddenPostIds, id],
        })),
    }),
    {
      name: 'hidden-posts-storage', // Tên của item trong storage (phải là duy nhất)
      storage: createJSONStorage(() => localStorage), // Chỉ định dùng localStorage
    }
  )
);

export default useHiddenPostsStore;
