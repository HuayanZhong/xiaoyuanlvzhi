import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../src/stores/app";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarCollapsed: false });
  });

  it("toggles the sidebar state", () => {
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);

    useAppStore.getState().toggleSidebar();

    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
  });
});
