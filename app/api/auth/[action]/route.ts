import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  SERVER_API,
  clearSessionCookies,
  isSameOrigin,
  proxyHeaders,
  setSessionCookies,
} from "@/lib/server/session-cookies";

export const dynamic = "force-dynamic";

type Upstream = { status: number; body: Record<string, unknown> | null };

async function call(path: string, req: NextRequest, init: { body?: unknown; token?: string } = {}): Promise<Upstream> {
  try {
    const res = await fetch(`${SERVER_API}${path}`, {
      method: init.token ? "GET" : "POST",
      headers: { ...proxyHeaders(req), ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, body };
  } catch {
    return { status: 503, body: { error: { code: "NETWORK", message: "The AbleSprout API is unreachable" } } };
  }
}

const fail = (u: Upstream) =>
  NextResponse.json(u.body ?? { error: { code: "HTTP_ERROR", message: "Request failed" } }, { status: u.status });

/** Returns { user, accessToken } to the browser and keeps the refresh token in an httpOnly cookie. */
function sessionResponse(user: { role: string }, accessToken: string, refreshToken: string) {
  const res = NextResponse.json({ user, accessToken }, { headers: { "Cache-Control": "no-store" } });
  setSessionCookies(res, refreshToken, user.role);
  return res;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Cross-origin request blocked" } }, { status: 403 });
  }

  switch (action) {
    case "login":
    case "register-school": {
      const body = await req.json().catch(() => ({}));
      const up = await call(`/auth/${action}`, req, { body });
      if (up.status >= 300 || !up.body) return fail(up);
      const { user, accessToken, refreshToken } = up.body as { user: { role: string }; accessToken: string; refreshToken: string };
      return sessionResponse(user, accessToken, refreshToken);
    }

    case "refresh": {
      const token = req.cookies.get(REFRESH_COOKIE)?.value;
      if (!token) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 });
      const up = await call("/auth/refresh", req, { body: { refreshToken: token } });
      if (up.status >= 300 || !up.body) {
        const res = fail(up);
        if (up.status === 401) clearSessionCookies(res);
        return res;
      }
      const { accessToken, refreshToken } = up.body as { accessToken: string; refreshToken: string };
      const me = await call("/auth/me", req, { token: accessToken });
      if (me.status !== 200 || !me.body) return fail(me);
      return sessionResponse((me.body as { user: { role: string } }).user, accessToken, refreshToken);
    }

    case "logout": {
      const token = req.cookies.get(REFRESH_COOKIE)?.value;
      if (token) await call("/auth/logout", req, { body: { refreshToken: token } });
      const res = new NextResponse(null, { status: 204 });
      clearSessionCookies(res);
      return res;
    }

    default:
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Unknown auth action" } }, { status: 404 });
  }
}
