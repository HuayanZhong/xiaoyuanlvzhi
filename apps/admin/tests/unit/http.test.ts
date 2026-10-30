import { beforeEach, describe, expect, it, vi } from "vitest";
import { onUnauthorized } from "../../src/lib/auth-events";
import {
  attachAuthorization,
  handleUnauthorized,
  resolveApiBaseUrl,
} from "../../src/lib/http";
import { clearToken, getToken, setToken } from "../../src/lib/token";

describe("resolveApiBaseUrl", () => {
  it("uses /api/v1/ when the environment value is missing", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("/api/v1/");
  });

  it("uses a configured environment value", () => {
    expect(resolveApiBaseUrl("https://api.example.test/v1")).toBe(
      "https://api.example.test/v1",
    );
  });

  it("trims a configured environment value", () => {
    expect(resolveApiBaseUrl("  /gateway/  ")).toBe("/gateway/");
  });

  it("falls back to /api/v1/ for a blank environment value", () => {
    expect(resolveApiBaseUrl("   ")).toBe("/api/v1/");
  });
});

describe("attachAuthorization", () => {
  beforeEach(() => {
    clearToken();
    localStorage.clear();
  });

  it("adds a Bearer header when a token exists", () => {
    setToken("spring-token");
    const request = { headers: new Headers() };

    attachAuthorization(request);

    expect(request.headers.get("Authorization")).toBe("Bearer spring-token");
  });

  it("leaves anonymous requests untouched", () => {
    const request = { headers: new Headers() };

    attachAuthorization(request);

    expect(request.headers.get("Authorization")).toBeNull();
  });
});

describe("handleUnauthorized", () => {
  beforeEach(() => {
    clearToken();
    localStorage.clear();
  });

  it("clears the token and emits an unauthorized event on 401", () => {
    setToken("expired-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized({ status: 401 });

    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("keeps the token on 403", () => {
    setToken("spring-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized({ status: 403 });

    expect(getToken()).toBe("spring-token");
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("keeps the token on 5xx", () => {
    setToken("spring-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized({ status: 503 });

    expect(getToken()).toBe("spring-token");
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("does not emit an expired-session event for a failed login", () => {
    setToken("stale-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized(
      { status: 401 },
      { url: "http://localhost:3000/api/v1/auth/login" },
    );

    expect(getToken()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("does not emit an expired-session event for a logout 401", () => {
    setToken("spring-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized(
      { status: 401 },
      { url: "http://localhost:3000/api/v1/auth/logout" },
    );

    expect(getToken()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("emits an expired-session event for a business 401", () => {
    setToken("spring-token");
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    handleUnauthorized(
      { status: 401 },
      { url: "http://localhost:3000/api/v1/auth/me" },
    );

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
