import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ClickSpark from "../../../src/components/ClickSpark";

describe("ClickSpark", () => {
  it("renders children with a decorative spark layer", () => {
    const { container } = render(
      <ClickSpark>
        <button type="button">触发火花</button>
      </ClickSpark>,
    );

    expect(
      screen.getByRole("button", { name: "触发火花" }),
    ).toBeInTheDocument();

    const layer = container.querySelector(".click-spark span");
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveStyle({ zIndex: 1, pointerEvents: "none" });
  });

  it("draws behind content when the layer prop is back", () => {
    const { container } = render(
      <ClickSpark layer="back">
        <p>内容</p>
      </ClickSpark>,
    );

    expect(container.querySelector(".click-spark span")).toHaveStyle({
      zIndex: -1,
    });
  });
});
