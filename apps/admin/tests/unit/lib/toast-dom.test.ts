import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { showToast } from "../../../src/lib/toast-dom";

afterEach(() => {
  vi.useRealTimers();
  document.querySelector('[data-testid="toast-list"]')?.remove();
});

describe("toast dom", () => {
  it("renders a toast and removes it after the duration", () => {
    vi.useFakeTimers();

    showToast("success", "登录成功");

    expect(screen.getByText("登录成功")).toBeInTheDocument();

    vi.advanceTimersByTime(3200);

    expect(screen.queryByText("登录成功")).not.toBeInTheDocument();
  });

  it("keeps multiple toasts in the same container", () => {
    showToast("success", "登录成功");
    showToast("error", "邮箱或密码错误");

    expect(screen.getByText("登录成功")).toBeInTheDocument();
    expect(screen.getByText("邮箱或密码错误")).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-testid="toast-list"]'),
    ).toHaveLength(1);
  });
});
