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
import ToastBridge from "../../../../src/components/auth/ToastBridge";
import LoginPage from "../../../../src/pages/auth/LoginPage";
import { useAuthStore } from "../../../../src/stores/auth";

const originalLogin = useAuthStore.getState().login;
const loginMock = vi.fn();

function DashboardStub() {
  return <h1>工作台</h1>;
}

function PlantsStub() {
  return <h1>单株库存</h1>;
}

function renderLogin(initialEntry = "/login") {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/dashboard", element: <DashboardStub /> },
      { path: "/plants/instances", element: <PlantsStub /> },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <AntdApp>
      <ToastBridge />
      <RouterProvider router={router} />
    </AntdApp>,
  );
}

function fillForm(username = "admin", password = "123456") {
  fireEvent.change(screen.getByPlaceholderText("请输入管理员账号"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByPlaceholderText("请输入密码"), {
    target: { value: password },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
    useAuthStore.setState({
      status: "anonymous",
      account: null,
      login: loginMock,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      status: "checking",
      account: null,
      login: originalLogin,
    });
  });

  it("renders the real login form without the static demo note", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入管理员账号")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeInTheDocument();
    expect(screen.queryByText(/静态演示/)).not.toBeInTheDocument();
  });

  it("shows required errors for an empty submit", async () => {
    renderLogin();

    submit();

    expect(await screen.findByText("请输入管理员账号")).toBeInTheDocument();
    expect(await screen.findByText("请输入密码")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("submits a short password without front-end length validation", async () => {
    loginMock.mockResolvedValue(undefined);
    renderLogin();

    fillForm("admin", "123");
    submit();

    expect(await screen.findByText("工作台")).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledWith("admin", "123");
    expect(screen.queryByText("密码至少 6 位")).not.toBeInTheDocument();
  });

  it("logs in and navigates to the dashboard", async () => {
    loginMock.mockResolvedValue(undefined);
    renderLogin();

    fillForm();
    submit();

    expect(await screen.findByText("工作台")).toBeInTheDocument();
    expect(await screen.findByText("登录成功")).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledWith("admin", "123456");
  });

  it("shows the login error and stays on the login page", async () => {
    loginMock.mockRejectedValue(new Error("邮箱或密码错误"));
    renderLogin();

    fillForm("admin", "wrong");
    submit();

    await waitFor(() => {
      expect(
        within(screen.getByTestId("toast-list")).getByText("邮箱或密码错误"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });

  it("returns to the internal path after login", async () => {
    loginMock.mockResolvedValue(undefined);
    renderLogin("/login?returnTo=%2Fplants%2Finstances");

    fillForm();
    submit();

    expect(await screen.findByText("单株库存")).toBeInTheDocument();
  });

  it("ignores an external returnTo and falls back to the dashboard", async () => {
    loginMock.mockResolvedValue(undefined);
    renderLogin("/login?returnTo=https%3A%2F%2Fexample.test");

    fillForm();
    submit();

    expect(await screen.findByText("工作台")).toBeInTheDocument();
  });

  it("does not render registration, forgot-password, or remember-me entries", () => {
    renderLogin();

    expect(screen.queryByText("注册")).not.toBeInTheDocument();
    expect(screen.queryByText("忘记密码？")).not.toBeInTheDocument();
    expect(screen.queryByText("记住我")).not.toBeInTheDocument();
  });
});
