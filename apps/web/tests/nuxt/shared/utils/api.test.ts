import { describe, expect, it } from "vitest";
import {
  DEFAULT_API_BASE_URL,
  resolveApiBaseUrl,
  resolveSpringApiTarget,
} from "../../../../shared/utils/api";

describe("web API base", () => {
  it("defaults to /api/v1/", () => {
    expect(DEFAULT_API_BASE_URL).toBe("/api/v1/");
    expect(resolveApiBaseUrl(undefined)).toBe("/api/v1/");
    expect(resolveApiBaseUrl("   ")).toBe("/api/v1/");
  });

  it("keeps a configured value and trims whitespace", () => {
    expect(resolveApiBaseUrl(" /gateway/v1/ ")).toBe("/gateway/v1/");
  });

  it("maps the catch-all path back under /api", () => {
    expect(
      resolveSpringApiTarget("http://localhost:8080", "v1/auth/login"),
    ).toBe("http://localhost:8080/api/v1/auth/login");
  });

  it("normalizes slashes and an empty catch-all", () => {
    expect(
      resolveSpringApiTarget("http://localhost:8080/", "/v1/profile"),
    ).toBe("http://localhost:8080/api/v1/profile");
    expect(resolveSpringApiTarget("http://localhost:8080", "")).toBe(
      "http://localhost:8080/api",
    );
  });
});
