import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RequireAdmin, {
  RedirectIfAuthenticated,
} from "@/components/auth/RequireAdmin";
import { useAuthStore } from "@/stores/auth";

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

function LoginStub() {
  const location = useLocation();

  return <p>login:{location.search}</p>;
}

function renderProtected(initialEntry = "/dashboard") {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginStub /> },
      {
        path: "/dashboard",
        element: (
          <RequireAdmin>
            <h1>受保护内容</h1>
          </RequireAdmin>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(<RouterProvider router={router} />);
}

function renderLogin(initialEntry = "/login") {
  const router = createMemoryRouter(
    [
      {
        path: "/login",
        element: (
          <RedirectIfAuthenticated>
            <h1>登录页</h1>
          </RedirectIfAuthenticated>
        ),
      },
      { path: "/dashboard", element: <h1>工作台</h1> },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(<RouterProvider router={router} />);
}

describe("RequireAdmin", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "checking", account: null });
  });

  afterEach(() => {
    useAuthStore.setState({ status: "checking", account: null });
  });

  it("redirects anonymous users to login with the original path", async () => {
    useAuthStore.setState({ status: "anonymous" });

    renderProtected();

    expect(
      await screen.findByText("login:?returnTo=%2Fdashboard"),
    ).toBeInTheDocument();
    expect(screen.queryByText("受保护内容")).not.toBeInTheDocument();
  });

  it("renders protected content for an authenticated admin", () => {
    useAuthStore.setState({
      status: "authenticated",
      account,
    });

    renderProtected();

    expect(screen.getByText("受保护内容")).toBeInTheDocument();
  });
});

describe("RedirectIfAuthenticated", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "checking", account: null });
  });

  afterEach(() => {
    useAuthStore.setState({ status: "checking", account: null });
  });

  it("renders the login page for anonymous users", () => {
    useAuthStore.setState({ status: "anonymous" });

    renderLogin();

    expect(screen.getByText("登录页")).toBeInTheDocument();
  });

  it("sends authenticated users to the dashboard", async () => {
    useAuthStore.setState({
      status: "authenticated",
      account,
    });

    renderLogin();

    expect(await screen.findByText("工作台")).toBeInTheDocument();
    expect(screen.queryByText("登录页")).not.toBeInTheDocument();
  });
});
