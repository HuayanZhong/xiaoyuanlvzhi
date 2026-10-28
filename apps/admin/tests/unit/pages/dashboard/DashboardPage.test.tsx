import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import DashboardPage from "../../../../src/pages/dashboard/DashboardPage";

function renderDashboard() {
  const router = createMemoryRouter(
    [{ path: "/dashboard", element: <DashboardPage /> }],
    { initialEntries: ["/dashboard"] },
  );

  return render(<RouterProvider router={router} />);
}

describe("DashboardPage", () => {
  it("renders the workbench placeholder", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "数据概览" }),
    ).toBeInTheDocument();
    expect(screen.getByText("暂无待审核事项")).toBeInTheDocument();
    expect(screen.getByText("领养申请")).toBeInTheDocument();
    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.getByText("环保活动")).toBeInTheDocument();
  });
});
