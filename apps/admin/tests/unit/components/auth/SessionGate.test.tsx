import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionGate from "@/components/auth/SessionGate";
import { useAuthStore } from "@/stores/auth";

const originalRestore = useAuthStore.getState().restore;
const originalClear = useAuthStore.getState().clear;

function resetStore() {
  useAuthStore.setState({
    status: "checking",
    account: null,
    restore: originalRestore,
    clear: originalClear,
  });
}

describe("SessionGate", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("shows loading state while restoring the session", () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ status: "checking", restore });

    render(
      <SessionGate>
        <h1>受保护内容</h1>
      </SessionGate>,
    );

    expect(screen.getByText("正在验证登录状态…")).toBeInTheDocument();
    expect(screen.queryByText("受保护内容")).not.toBeInTheDocument();
    expect(restore).toHaveBeenCalledOnce();
  });

  it("renders children after the session is resolved", () => {
    useAuthStore.setState({
      status: "authenticated",
      restore: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <SessionGate>
        <h1>受保护内容</h1>
      </SessionGate>,
    );

    expect(screen.getByText("受保护内容")).toBeInTheDocument();
  });

  it("shows a retry action when session restoration fails", () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ status: "error", restore });

    render(
      <SessionGate>
        <h1>受保护内容</h1>
      </SessionGate>,
    );

    expect(screen.getByText("无法验证登录状态")).toBeInTheDocument();
    expect(screen.queryByText("受保护内容")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(restore).toHaveBeenCalledTimes(2);
  });

  it("clears the session when the user chooses to sign in again", () => {
    const clear = vi.fn();
    useAuthStore.setState({
      status: "error",
      restore: vi.fn().mockResolvedValue(undefined),
      clear,
    });

    render(
      <SessionGate>
        <h1>受保护内容</h1>
      </SessionGate>,
    );

    fireEvent.click(screen.getByRole("button", { name: /重新登录/ }));

    expect(clear).toHaveBeenCalledOnce();
  });
});
