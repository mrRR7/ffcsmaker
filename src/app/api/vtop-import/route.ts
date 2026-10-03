import { NextResponse } from "next/server";
import { sanitizeImport } from "@/lib/vtopImport/sanitize";
import { storeVtopImport } from "@/lib/vtopImport/storage";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Open CORS is required here (the bookmarklet posts from vtop.vit.ac.in), so
// this endpoint is reachable from any origin. Rate limit it per-IP to keep an
// unauthenticated write endpoint from being scripted into a storage abuse
// vector.
const VTOP_IMPORT_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const MAX_BODY_CHARS = 2_000_000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`vtop-import:${clientIp}`, VTOP_IMPORT_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many imports. Try again later." },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": String(Math.ceil(retryAfterMs / 1000))
        }
      }
    );
  }

  try {
    // Size check before parsing, not after.
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    const payload = sanitizeImport(parsed);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid import payload." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (payload.courses.length === 0) {
      return NextResponse.json(
        { error: "No registration data found." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { token, expiresAt } = await storeVtopImport(payload);

    return NextResponse.json(
      { token, expiresAt },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("vtop-import store failed:", error);
    return NextResponse.json(
      { error: "Failed to store import." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
