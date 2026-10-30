import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { App as AntdApp } from "antd";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastBridge from "@/components/auth/ToastBridge";
import HeaderActions from "@/components/layout/HeaderActions";
import { useAuthStore } from "@/stores/auth";

const originalLogout = useAuthStore.getState().logout;
const logoutMock = vi.fn();

const account = {
  id: 1,
  email: "admin@campus.local",
  role: "ADMIN",
  status: "ACTIVE",
  fullName: "管理员",
  studentNumber: null,
  department: null,
  className: null,
  phone: null,
};

function renderHeaderActions() {
  const router = createMemoryRouter(
    [
      { path: "/dashboard", element: <HeaderActions /> },
      { path: "/login", element: <h1>登录页</h1> },
    ],
    { initialEntries: ["/dashboard"] },
  );

  return render(
    <AntdApp>
      <ToastBridge />
      <RouterProvider router={router} />
    </AntdApp>,
  );
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole("button", { name: "账号菜单" }));
}

describe("HeaderActions", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    useAuthStore.setState({
      status: "authenticated",
      account,
      logout: logoutMock,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      status: "checking",
      account: null,
      logout: originalLogout,
    });
  });

  it("shows the current account and logout entry", async () => {
    renderHeaderActions();

    openAccountMenu();

    expect(await screen.findByText("管理员")).toBeInTheDocument();
    expect(screen.getByText("退出登录")).toBeInTheDocument();
  });

  it("logs out and returns to the login page", async () => {
    logoutMock.mockResolvedValue({ revokeFailed: false });
    renderHeaderActions();

    openAccountMenu();
    fireEvent.click(await screen.findByText("退出登录"));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
    });
    expect(await screen.findByText("登录页")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("toast-list")).getByText("已退出登录"),
    ).toBeInTheDocument();
  });

  it("shows a warning toast when the server token could not be revoked", async () => {
    logoutMock.mockResolvedValue({ revokeFailed: true });
    renderHeaderActions();

    openAccountMenu();
    fireEvent.click(await screen.findByText("退出登录"));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
    });
    expect(await screen.findByText("登录页")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("toast-list")).getByText(
        "已退出本地登录，但服务端令牌可能仍未失效",
      ),
    ).toBeInTheDocument();
  });
});
