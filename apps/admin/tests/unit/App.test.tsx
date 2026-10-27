import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("renders the primary button", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Button" })).toBeInTheDocument();
  });
});
