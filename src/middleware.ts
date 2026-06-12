import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

// Routes that require an active session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/portfolio",
  "/news",
  "/alerts",
  "/watchlist",
  "/settings",
];

// Routes that authenticated users should be bounced away from
const AUTH_PATHS = ["/login", "/signup", "/reset"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!session?.value;

  // Unauthenticated user hitting a protected page → send to login
  if (isProtected(pathname) && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Preserve intended destination for post-login redirect
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting an auth page → send to dashboard
  if (isAuthPath(pathname) && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals, static assets, and image optimization URLs
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
