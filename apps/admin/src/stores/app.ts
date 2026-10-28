import { create } from "zustand";

type AppState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

/** admin 全局 UI 状态的骨架；接入布局后可直接复用。 */
export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
