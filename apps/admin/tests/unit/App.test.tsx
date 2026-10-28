import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("redirects the root route to the login page", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "登录管理后台" }),
    ).toBeInTheDocument();
  });
});
