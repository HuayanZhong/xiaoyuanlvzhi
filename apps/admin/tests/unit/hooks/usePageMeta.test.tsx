import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { usePageMeta } from "../../../src/hooks/usePageMeta";

function Probe() {
  const { group, item, breadcrumb, search } = usePageMeta();

  return (
    <div data-testid="meta">
      {[
        group?.label ?? "",
        item?.label ?? "",
        breadcrumb.map((part) => part.title).join("/"),
        search,
      ].join("|")}
    </div>
  );
}

function renderPath(path: string) {
  const router = createMemoryRouter([{ path: "*", element: <Probe /> }], {
    initialEntries: [path],
  });

  return render(<RouterProvider router={router} />);
}

describe("usePageMeta", () => {
  it("derives the workbench group and item", () => {
    renderPath("/dashboard");

    expect(screen.getByTestId("meta")).toHaveTextContent(
      "运营|工作台|运营/工作台|",
    );
  });

  it("derives a resource item from a deep link", () => {
    renderPath("/plants/instances");

    expect(screen.getByTestId("meta")).toHaveTextContent(
      "资源|单株库存|资源/单株库存|",
    );
  });

  it("keeps the query string for module tabs", () => {
    renderPath("/tasks?tab=proofs");

    expect(screen.getByTestId("meta")).toHaveTextContent(
      "运营|环保任务|运营/环保任务|?tab=proofs",
    );
  });

  it("returns empty metadata for an unknown path", () => {
    renderPath("/unknown");

    expect(screen.getByTestId("meta")).toHaveTextContent("|||");
  });
});
