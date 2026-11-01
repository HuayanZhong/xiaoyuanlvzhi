import { afterEach, describe, expect, it } from "vitest";
import {
  TOKEN_COOKIE_NAME,
  clearToken,
  getToken,
  setToken,
} from "../../../app/utils/token";

function resetCookie(): void {
  document.cookie = `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/`;
}

describe("student token storage", () => {
  afterEach(() => {
    clearToken();
    resetCookie();
  });

  it("stores the token in a student-specific cookie", () => {
    setToken("token-value");

    expect(TOKEN_COOKIE_NAME).toBe("student-auth-token");
    expect(document.cookie).toContain("student-auth-token=token-value");
    expect(window.localStorage.getItem("student-auth-token")).toBeNull();
  });

  it("clears both the cookie and in-memory token", () => {
    setToken("token-value");
    clearToken();

    expect(getToken()).toBeNull();
    expect(document.cookie).not.toContain("student-auth-token=token-value");
  });

  it("reads a token written by a previous page load", () => {
    document.cookie = `${TOKEN_COOKIE_NAME}=cookie-token; Path=/`;

    expect(getToken()).toBe("cookie-token");
  });
});
