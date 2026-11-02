import { describe, expect, it } from "vitest";
import {
  resolveAuthRedirect,
  resolveReturnTo,
  resolveUnauthorizedRedirect,
} from "~/utils/auth-route";

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

  it("protects the plant and adoption routes for anonymous visitors", () => {
    expect(resolveAuthRedirect(target("/plants"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/plants" },
    });
    expect(
      resolveAuthRedirect(target("/plants/3", "/plants/3?x=1"), anonymous),
    ).toEqual({
      path: "/login",
      query: { returnTo: "/plants/3?x=1" },
    });
    expect(resolveAuthRedirect(target("/adoptions/9"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/adoptions/9" },
    });
    expect(resolveAuthRedirect(target("/tasks"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/tasks" },
    });
    expect(resolveAuthRedirect(target("/tasks/7"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/tasks/7" },
    });
    expect(resolveAuthRedirect(target("/points"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/points" },
    });
    expect(resolveAuthRedirect(target("/rewards"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/rewards" },
    });
    expect(resolveAuthRedirect(target("/rewards/orders/3"), anonymous)).toEqual(
      {
        path: "/login",
        query: { returnTo: "/rewards/orders/3" },
      },
    );
    expect(resolveAuthRedirect(target("/my-plants"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/my-plants" },
    });
    expect(resolveAuthRedirect(target("/my-plants/10"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/my-plants/10" },
    });
    expect(resolveAuthRedirect(target("/care/9"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/care/9" },
    });
    expect(resolveAuthRedirect(target("/notifications"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/notifications" },
    });
    expect(resolveAuthRedirect(target("/feedback"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/feedback" },
    });
    expect(resolveAuthRedirect(target("/feedback/5"), anonymous)).toEqual({
      path: "/login",
      query: { returnTo: "/feedback/5" },
    });
  });

  it("keeps lookalike paths public", () => {
    expect(resolveAuthRedirect(target("/plantsx"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/adoptions-old"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/tasksx"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/pointsx"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/rewards-old"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/my-plantsx"), anonymous)).toBeNull();
    expect(resolveAuthRedirect(target("/care-old"), anonymous)).toBeNull();
    expect(
      resolveAuthRedirect(target("/notifications-old"), anonymous),
    ).toBeNull();
    expect(resolveAuthRedirect(target("/feedbackx"), anonymous)).toBeNull();
  });

  it("allows authenticated visitors into the plant and adoption routes", () => {
    expect(resolveAuthRedirect(target("/plants"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/plants/3"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/adoptions"), authenticated)).toBeNull();
    expect(
      resolveAuthRedirect(target("/adoptions/9"), authenticated),
    ).toBeNull();
    expect(resolveAuthRedirect(target("/tasks"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/tasks/7"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/points"), authenticated)).toBeNull();
    expect(resolveAuthRedirect(target("/rewards"), authenticated)).toBeNull();
    expect(
      resolveAuthRedirect(target("/rewards/orders/3"), authenticated),
    ).toBeNull();
    expect(resolveAuthRedirect(target("/my-plants"), authenticated)).toBeNull();
    expect(
      resolveAuthRedirect(target("/my-plants/10"), authenticated),
    ).toBeNull();
    expect(resolveAuthRedirect(target("/care/9"), authenticated)).toBeNull();
    expect(
      resolveAuthRedirect(target("/notifications"), authenticated),
    ).toBeNull();
    expect(resolveAuthRedirect(target("/feedback"), authenticated)).toBeNull();
    expect(
      resolveAuthRedirect(target("/feedback/5"), authenticated),
    ).toBeNull();
  });

  it("sends unauthorized business pages to login", () => {
    expect(resolveUnauthorizedRedirect(target("/plants/3"))).toEqual({
      path: "/login",
      query: { returnTo: "/plants/3" },
    });
    expect(resolveUnauthorizedRedirect(target("/care/9"))).toEqual({
      path: "/login",
      query: { returnTo: "/care/9" },
    });
    expect(resolveUnauthorizedRedirect(target("/tasks/7"))).toEqual({
      path: "/login",
      query: { returnTo: "/tasks/7" },
    });
    expect(resolveUnauthorizedRedirect(target("/points"))).toEqual({
      path: "/login",
      query: { returnTo: "/points" },
    });
    expect(resolveUnauthorizedRedirect(target("/rewards/orders/3"))).toEqual({
      path: "/login",
      query: { returnTo: "/rewards/orders/3" },
    });
    expect(resolveUnauthorizedRedirect(target("/notifications"))).toEqual({
      path: "/login",
      query: { returnTo: "/notifications" },
    });
    expect(resolveUnauthorizedRedirect(target("/feedback/5"))).toEqual({
      path: "/login",
      query: { returnTo: "/feedback/5" },
    });
    expect(resolveUnauthorizedRedirect(target("/unknown"))).toBeNull();
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
