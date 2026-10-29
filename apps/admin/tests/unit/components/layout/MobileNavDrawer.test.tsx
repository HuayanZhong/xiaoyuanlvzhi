import { fireEvent, render, screen } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it, vi } from "vitest";
import MobileNavDrawer from "../../../../src/components/layout/MobileNavDrawer";

function renderDrawer(onClose = vi.fn()) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: <MobileNavDrawer onClose={onClose} open />,
      },
    ],
    { initialEntries: ["/dashboard"] },
  );

  render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  );

  return onClose;
}

describe("MobileNavDrawer", () => {
  it("renders all groups and closes after selecting an item", async () => {
    const onClose = renderDrawer();

    expect(await screen.findByText("运营")).toBeInTheDocument();
    expect(screen.getByText("资源")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /领养管理/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
