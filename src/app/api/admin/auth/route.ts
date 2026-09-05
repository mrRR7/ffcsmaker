import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminAuthRateLimit,
  createAdminSessionToken,
  verifyAdminPassword
} from "@/lib/adminAuth";
import { getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const { allowed, retryAfterMs } = checkAdminAuthRateLimit(clientIp);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
      }
    );
  }

  const { password } = await request.json();
  const isValid = await verifyAdminPassword(password);

  if (!isValid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    sameSite: "strict",
    path: "/"
  });
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
