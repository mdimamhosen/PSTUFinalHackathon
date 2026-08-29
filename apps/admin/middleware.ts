import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("relay_admin_token");
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";

  if (!token && !isLogin && path !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/users", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
