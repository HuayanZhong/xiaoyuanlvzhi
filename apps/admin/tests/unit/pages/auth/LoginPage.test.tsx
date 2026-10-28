import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import LoginPage from "../../../../src/pages/auth/LoginPage";

function DashboardStub() {
  return <h1>数据概览</h1>;
}

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/dashboard", element: <DashboardStub /> },
    ],
    { initialEntries: ["/login"] },
  );

  return render(<RouterProvider router={router} />);
}

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入管理员账号")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登\s*录/ })).toBeInTheDocument();
  });

  it("shows required errors for an empty submit", async () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));

    expect(await screen.findByText("请输入管理员账号")).toBeInTheDocument();
    expect(await screen.findByText("请输入密码")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });

  it("rejects a password shorter than six characters", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("请输入管理员账号"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("请输入密码"), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));

    expect(await screen.findByText("密码至少 6 位")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });

  it("navigates to the dashboard with valid credentials", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("请输入管理员账号"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("请输入密码"), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));

    expect(
      await screen.findByRole("heading", { name: "数据概览" }),
    ).toBeInTheDocument();
  });

  it("does not render registration, forgot-password, or remember-me entries", () => {
    renderLogin();

    expect(screen.queryByText("注册")).not.toBeInTheDocument();
    expect(screen.queryByText("忘记密码？")).not.toBeInTheDocument();
    expect(screen.queryByText("记住我")).not.toBeInTheDocument();
  });
});
