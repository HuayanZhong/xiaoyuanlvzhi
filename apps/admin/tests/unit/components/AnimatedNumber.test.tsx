import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AnimatedNumber from "../../../src/components/common/AnimatedNumber";

const originalMatchMedia = window.matchMedia;

function allowMotion() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("AnimatedNumber", () => {
  it("renders the target directly when motion is reduced", () => {
    render(<AnimatedNumber value={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("starts from zero when motion is allowed", () => {
    allowMotion();
    render(<AnimatedNumber value={42} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
