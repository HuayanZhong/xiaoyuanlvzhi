import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type AppState = {
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
  toggleSidebar: () => void;
  toggleTheme: () => void;
};

/** admin 全局 UI 状态的骨架；接入布局后可直接复用。 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      themeMode: "light",
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
    }),
    {
      name: "admin-ui",
      partialize: (state) => ({ themeMode: state.themeMode }),
    },
  ),
);
