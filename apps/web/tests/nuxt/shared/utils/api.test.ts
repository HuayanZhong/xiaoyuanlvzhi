import { describe, expect, it } from "vitest";
import {
  DEFAULT_API_BASE_URL,
  API_PREFIX,
  resolveApiBaseUrl,
  resolveSpringApiV1Target,
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

  it("maps the v1 Nitro wildcard without duplicating the prefix", () => {
    expect(API_PREFIX).toBe("/api/v1");
    expect(resolveSpringApiV1Target("http://localhost:8080/", "/auth/me")).toBe(
      "http://localhost:8080/api/v1/auth/me",
    );
    expect(resolveSpringApiV1Target("http://localhost:8080", "")).toBe(
      "http://localhost:8080/api/v1",
    );
  });

  it("normalizes slashes and an empty catch-all", () => {
    expect(
      resolveSpringApiTarget("http://localhost:8080/", "/v1/profile"),
    ).toBe("http://localhost:8080/api/v1/profile");
    expect(resolveSpringApiTarget("http://localhost:8080", "")).toBe(
      "http://localhost:8080/api",
    );
  });

  it("forwards the browser query string", () => {
    expect(
      resolveSpringApiTarget(
        "http://localhost:8080",
        "v1/plants",
        "?keyword=%E7%BB%BF&location=%E5%9B%BE%E4%B9%A6%E9%A6%86",
      ),
    ).toBe(
      "http://localhost:8080/api/v1/plants?keyword=%E7%BB%BF&location=%E5%9B%BE%E4%B9%A6%E9%A6%86",
    );
    expect(
      resolveSpringApiTarget("http://localhost:8080", "v1/plants", "keyword=x"),
    ).toBe("http://localhost:8080/api/v1/plants?keyword=x");
  });
});
