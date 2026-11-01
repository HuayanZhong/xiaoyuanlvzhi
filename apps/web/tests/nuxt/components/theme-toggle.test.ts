import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import ThemeToggle from "../../../app/components/ThemeToggle.vue";

const { toggleTheme } = vi.hoisted(() => ({ toggleTheme: vi.fn() }));

vi.mock("~/composables/useTheme", async () => {
  const { ref } = await import("vue");

  return {
    useTheme: () => ({
      isDark: ref(false),
      toggleTheme,
    }),
  };
});

describe("ThemeToggle", () => {
  it("announces the next theme and toggles on click", async () => {
    const wrapper = await mountSuspended(ThemeToggle);
    const button = wrapper.get("button");

    expect(button.attributes("aria-label")).toBe("切换暗夜模式");
    expect(button.attributes("aria-pressed")).toBe("false");
    expect(button.text()).toContain("暗夜");

    await button.trigger("click");

    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
