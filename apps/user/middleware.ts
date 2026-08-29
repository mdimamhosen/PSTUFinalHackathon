import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("relay_token");
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/register";
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/send") ||
    path.startsWith("/request") ||
    path.startsWith("/receive") ||
    path.startsWith("/split") ||
    path.startsWith("/activity") ||
    path.startsWith("/notifications") ||
    path.startsWith("/contacts") ||
    path.startsWith("/rewards") ||
    path.startsWith("/pay") ||
    path === "/verify";

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
