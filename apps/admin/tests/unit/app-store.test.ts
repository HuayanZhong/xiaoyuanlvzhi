import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../src/stores/app";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarCollapsed: false, themeMode: "light" });
  });

  it("toggles the sidebar state", () => {
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);

    useAppStore.getState().toggleSidebar();

    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
  });

  it("toggles the theme mode", () => {
    expect(useAppStore.getState().themeMode).toBe("light");

    useAppStore.getState().toggleTheme();

    expect(useAppStore.getState().themeMode).toBe("dark");
  });
});
