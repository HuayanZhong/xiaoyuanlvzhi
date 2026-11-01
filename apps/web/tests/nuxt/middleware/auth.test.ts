import { describe, expect, it } from "vitest";
import { resolveAuthRedirect, resolveReturnTo } from "~/utils/auth-route";

const anonymous = { status: "anonymous" as const, isAuthenticated: false };
const authenticated = {
  status: "authenticated" as const,
  isAuthenticated: true,
};

function target(path: string, fullPath = path) {
  return { path, fullPath, query: {} };
}

describe("auth route guard", () => {
  it("redirects anonymous visitors away from protected pages with returnTo", () => {
    expect(resolveAuthRedirect(target("/me"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/me" },
    });
    expect(resolveAuthRedirect(target("/"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/" },
    });
  });

  it("keeps public pages open for anonymous visitors", () => {
    expect(resolveAuthRedirect(target("/login"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/register"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/unknown"), anonymous)).toBeNull();
  });

  it("sends authenticated visitors from auth pages to home", () => {
    expect(resolveAuthRedirect(target("/login"), authenticated)).toEqual({
      path: "/",
    });
    expect(resolveAuthRedirect(target("/register"), authenticated)).toEqual({
      path: "/",
    });
  });

  it("does not interfere with the 404 catch-all or protected pages when authenticated", () => {
    expect(resolveAuthRedirect(target("/unknown"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/me"), authenticated)).toBeNull();
  });
});

describe("returnTo", () => {
  it("accepts a single internal business path", () => {
    expect(resolveReturnTo("/me")).toBe("/me");
    expect(resolveReturnTo("/me?tab=points")).toBe("/me?tab=points");
  });

  it("rejects external, protocol-relative and backslash paths", () => {
    expect(resolveReturnTo("https://example.test")).toBe("/");
    expect(resolveReturnTo("//example.test")).toBe("/");
    expect(resolveReturnTo("/\\example.test")).toBe("/");
  });

  it("rejects auth pages to avoid a redirect loop", () => {
    expect(resolveReturnTo("/login")).toBe("/");
    expect(resolveReturnTo("/register?x=1")).toBe("/");
  });

  it("rejects duplicate or non-string query values", () => {
    expect(resolveReturnTo(["/me", "/login"])).toBe("/");
    expect(resolveReturnTo(undefined)).toBe("/");
  });
});
