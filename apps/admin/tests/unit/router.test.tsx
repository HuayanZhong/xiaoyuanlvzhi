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
  });

  it("renders the dashboard at /dashboard", async () => {
    renderPath("/dashboard");

    expect(
      await screen.findByRole("heading", { name: "数据概览" }),
    ).toBeInTheDocument();
  });

  it("redirects unknown paths to login", async () => {
    renderPath("/unknown");

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });
});
