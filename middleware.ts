import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE = "as_rt";
const ROLE_COOKIE = "as_role";

/** Routes only some roles may open. Everything else under /app is open to any signed-in user. */
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [{ prefix: "/app/team", roles: ["ADMIN"] }];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);
  const role = req.cookies.get(ROLE_COOKIE)?.value;

  if (pathname.startsWith("/app")) {
    if (!signedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (pathname === "/app" || pathname === "/app/") return NextResponse.redirect(new URL("/app/dashboard", req.url));
    const rule = ROLE_ROUTES.find((r) => pathname.startsWith(r.prefix));
    if (rule && (!role || !rule.roles.includes(role))) {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }
  }

  if ((pathname === "/login" || pathname === "/register-school") && signedIn) {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register-school"],
};
