import { render, screen } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { routes } from "../../src/router";

function renderPath(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  );
}

describe("admin routes", () => {
  it("redirects the root path to login", async () => {
    renderPath("/");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /运营/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the shell and workbench at /dashboard", async () => {
    renderPath("/dashboard");

    expect(
      await screen.findByRole("menuitem", { name: /运营/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "工作台" })).toBeInTheDocument();
  });

  it("renders the shell and placeholder at /adoptions", async () => {
    renderPath("/adoptions");

    expect(
      await screen.findByRole("heading", { name: "领养管理" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /运营/ })).toBeInTheDocument();
  });

  it("redirects unknown paths to login", async () => {
    renderPath("/unknown");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });
});
