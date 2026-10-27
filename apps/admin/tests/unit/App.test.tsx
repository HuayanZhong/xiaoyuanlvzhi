import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("renders the admin heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "校园绿植领养与环保激励系统" }),
    ).toBeInTheDocument();
  });
});
