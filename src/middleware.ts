import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const adminSession = request.cookies.get("admin_session")?.value;

  if (isLoginPage) {
    return NextResponse.next();
  }

  if (!adminSecret || adminSession !== adminSecret) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
