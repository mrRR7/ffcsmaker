import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  if (!adminSecret || password !== adminSecret) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 86_400,
    sameSite: "strict",
    path: "/"
  });
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete("admin_session");
  return response;
}
