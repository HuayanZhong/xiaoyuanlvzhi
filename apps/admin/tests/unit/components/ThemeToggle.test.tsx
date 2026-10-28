import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ThemeToggle from "../../../src/components/ThemeToggle";
import { useAppStore } from "../../../src/stores/app";

describe("ThemeToggle", () => {
  beforeEach(() => {
    useAppStore.setState({ themeMode: "light" });
  });

  it("toggles the stored theme mode and updates its label", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "切换到暗色模式" }));

    expect(useAppStore.getState().themeMode).toBe("dark");
    expect(
      screen.getByRole("button", { name: "切换到亮色模式" }),
    ).toBeInTheDocument();
  });
});
