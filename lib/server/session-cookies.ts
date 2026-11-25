import "server-only";
import type { NextRequest, NextResponse } from "next/server";

export const REFRESH_COOKIE = "as_rt";
export const ROLE_COOKIE = "as_role";
const MAX_AGE = 7 * 24 * 60 * 60; // matches the API's 7-day refresh token

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // not sent on cross-site POSTs => CSRF-safe refresh
  path: "/",
  maxAge: MAX_AGE,
};

export function setSessionCookies(res: NextResponse, refreshToken: string, role: string) {
  res.cookies.set(REFRESH_COOKIE, refreshToken, base);
  // Role is only used by middleware for UX redirects; the API enforces real authorisation.
  res.cookies.set(ROLE_COOKIE, role, base);
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(REFRESH_COOKIE, "", { ...base, maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, "", { ...base, maxAge: 0 });
}

/** Server-to-server URL of the API (can differ from the public one, e.g. a private network). */
export const SERVER_API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "") + "/api/v1";

/** Headers that let the API rate-limit by the real client IP instead of this server's IP. */
export function proxyHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const secret = process.env.PROXY_SHARED_SECRET;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (secret && ip) {
    h["X-Proxy-Secret"] = secret;
    h["X-Client-IP"] = ip;
  }
  return h;
}

/** Rejects cross-origin requests to the cookie-bearing endpoints (defence in depth on top of SameSite). */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it; SameSite still applies
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
