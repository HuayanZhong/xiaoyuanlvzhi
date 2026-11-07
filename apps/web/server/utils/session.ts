import type { H3Event } from "h3";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "~~/shared/utils/auth";

export function readSessionToken(event: H3Event): string | null {
  return getCookie(event, SESSION_COOKIE_NAME) ?? null;
}

export function setSessionToken(event: H3Event, token: string): void {
  const config = useRuntimeConfig(event);

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.sessionCookieSecure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionToken(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: useRuntimeConfig(event).sessionCookieSecure,
    path: "/",
  });
}
