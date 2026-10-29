import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import PlaceholderPage from "../../../../src/pages/placeholder/PlaceholderPage";

function renderPath(path: string) {
  const router = createMemoryRouter(
    [{ path: "*", element: <PlaceholderPage /> }],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe("PlaceholderPage", () => {
  it("renders the module title and construction state", () => {
    renderPath("/adoptions");

    expect(
      screen.getByRole("heading", { name: "领养管理" }),
    ).toBeInTheDocument();
    expect(screen.getByText("该模块正在建设中")).toBeInTheDocument();
  });

  it("lets the content card fill the content area", () => {
    renderPath("/adoptions");

    const card = document.querySelector(".ant-card");

    expect(card).not.toBeNull();
    expect((card as HTMLElement).style.maxWidth).toBe("");
  });
});
