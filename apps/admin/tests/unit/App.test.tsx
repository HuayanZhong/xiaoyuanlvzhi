import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("renders the home route", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "管理后台" }),
    ).toBeInTheDocument();
  });
});
