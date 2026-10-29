import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BrandMark from "../../../src/components/BrandMark";

describe("BrandMark", () => {
  it("renders a text wordmark without a graphic mark", () => {
    const { container } = render(<BrandMark />);

    expect(screen.getByText("校园绿植领养")).toBeInTheDocument();
    expect(screen.getByText("管理后台")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("hides the subtitle in compact mode", () => {
    render(<BrandMark compact />);

    expect(screen.getByText("校园绿植领养")).toBeInTheDocument();
    expect(screen.queryByText("管理后台")).not.toBeInTheDocument();
  });
});
