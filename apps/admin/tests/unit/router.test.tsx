import { render, screen } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../src/router";
import { useAuthStore } from "../../src/stores/auth";

vi.mock("@/api/plants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/plants")>();

  return {
    ...actual,
    listSpecies: vi.fn().mockResolvedValue([]),
    listIndividuals: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

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

function renderPath(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  );
}

afterEach(() => {
  useAuthStore.setState({ status: "checking", account: null });
});

describe("admin routes", () => {
  it("redirects the root path to login", async () => {
    useAuthStore.setState({ status: "anonymous", account: null });

    renderPath("/");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /运营/ }),
    ).not.toBeInTheDocument();
  });

  it("redirects an unauthenticated dashboard visit to login", async () => {
    useAuthStore.setState({ status: "anonymous", account: null });

    renderPath("/dashboard");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "工作台" }),
    ).not.toBeInTheDocument();
  });

  it("renders the shell and workbench for an authenticated admin", async () => {
    useAuthStore.setState({ status: "authenticated", account });

    renderPath("/dashboard");

    expect(
      await screen.findByRole("menuitem", { name: /运营/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "工作台" })).toBeInTheDocument();
  });

  it("renders a module placeholder for an authenticated admin", async () => {
    useAuthStore.setState({ status: "authenticated", account });

    renderPath("/adoptions");

    expect(
      await screen.findByRole("heading", { name: "领养管理" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /运营/ })).toBeInTheDocument();
  });

  it("renders the species page instead of a placeholder", async () => {
    useAuthStore.setState({ status: "authenticated", account });

    renderPath("/plants/species");

    expect(
      await screen.findByRole("heading", { name: "品种档案" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("该模块正在建设中")).not.toBeInTheDocument();
  });

  it("renders the instances page instead of a placeholder", async () => {
    useAuthStore.setState({ status: "authenticated", account });

    renderPath("/plants/instances");

    expect(
      await screen.findByRole("heading", { name: "单株库存" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("该模块正在建设中")).not.toBeInTheDocument();
  });

  it("redirects an authenticated admin away from the login page", async () => {
    useAuthStore.setState({ status: "authenticated", account });

    renderPath("/login");

    expect(
      await screen.findByRole("heading", { name: "工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "登录管理后台" }),
    ).not.toBeInTheDocument();
  });

  it("redirects unknown paths to login for anonymous users", async () => {
    useAuthStore.setState({ status: "anonymous", account: null });

    renderPath("/unknown");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });
});
