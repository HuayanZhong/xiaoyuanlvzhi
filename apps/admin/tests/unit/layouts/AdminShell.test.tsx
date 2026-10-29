import { fireEvent, render, screen } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminShell from "../../../src/layouts/AdminShell";
import { useAppStore } from "../../../src/stores/app";

const originalMatchMedia = window.matchMedia;

function renderShell(path = "/dashboard") {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <div data-testid="page">登录页</div> },
      {
        element: <AdminShell />,
        children: [
          {
            path: "dashboard",
            element: <div data-testid="page">工作台内容</div>,
          },
          {
            path: "adoptions",
            element: <div data-testid="page">领养管理内容</div>,
          },
          {
            path: "plants/species",
            element: <div data-testid="page">品种档案内容</div>,
          },
          {
            path: "plants/instances",
            element: <div data-testid="page">单株库存内容</div>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  );
}

function useMobileMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("max-width: 991px"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  useAppStore.setState({ sidebarCollapsed: false, themeMode: "light" });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("AdminShell", () => {
  it("renders five top-level groups and the active group's children", () => {
    renderShell();

    for (const label of ["运营", "资源", "积分", "用户", "数据"]) {
      expect(
        screen.getByRole("menuitem", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }

    for (const label of [
      "工作台",
      "领养管理",
      "养护审核",
      "环保任务",
      "问题反馈",
    ]) {
      expect(
        screen.getByRole("menuitem", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }

    expect(screen.getByTestId("page")).toHaveTextContent("工作台内容");
  });

  it("switches the side menu when a top-level group is clicked", async () => {
    renderShell();

    fireEvent.click(screen.getByRole("menuitem", { name: /资源/ }));

    expect(await screen.findByTestId("page")).toHaveTextContent("品种档案内容");
    expect(
      await screen.findByRole("menuitem", { name: /品种档案/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /单株库存/ }),
    ).toBeInTheDocument();
  });

  it("selects the group and item from a deep link", () => {
    renderShell("/plants/instances");

    expect(screen.getByRole("menuitem", { name: /资源/ })).toHaveClass(
      "ant-menu-item-selected",
    );
    expect(screen.getByRole("menuitem", { name: /单株库存/ })).toHaveClass(
      "ant-menu-item-selected",
    );
  });

  it("collapses the side navigation from the header", () => {
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: "折叠导航" }));

    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
    expect(
      screen.getByRole("button", { name: "展开导航" }),
    ).toBeInTheDocument();
  });

  it("opens the drawer and navigates on narrow screens", async () => {
    useMobileMatchMedia();
    renderShell();

    expect(
      screen.queryByRole("menuitem", { name: /领养管理/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "打开导航" }));

    const adoptionItem = await screen.findByRole("menuitem", {
      name: /领养管理/,
    });
    fireEvent.click(adoptionItem);

    expect(await screen.findByTestId("page")).toHaveTextContent("领养管理内容");
  });

  it("renders the header actions as dashed buttons", () => {
    renderShell();

    for (const name of ["折叠导航", "切换到暗色模式", "账号菜单"]) {
      expect(screen.getByRole("button", { name })).toHaveClass(
        "ant-btn-dashed",
      );
    }
  });

  it("toggles the theme and logs out from the header", async () => {
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: "切换到暗色模式" }));
    expect(useAppStore.getState().themeMode).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: "账号菜单" }));
    fireEvent.click(await screen.findByText("退出登录"));

    expect(await screen.findByTestId("page")).toHaveTextContent("登录页");
  });
});
