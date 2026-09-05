import { NextResponse } from "next/server";
import type { PlannerImportJSON } from "@/features/vtop-scraper/types";
import { storeVtopImport } from "@/lib/vtopImport/storage";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Open CORS is required here (the bookmarklet posts from vtop.vit.ac.in), so
// this endpoint is reachable from any origin. Rate limit it per-IP to keep an
// unauthenticated 2MB-per-request write endpoint from being scripted into a
// storage abuse vector.
const VTOP_IMPORT_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

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
    const body = (await request.json()) as PlannerImportJSON;

    if (!body || typeof body !== "object" || !Array.isArray(body.courses)) {
      return NextResponse.json(
        { error: "Invalid import payload." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (body.courses.length === 0) {
      return NextResponse.json(
        { error: "No registration data found." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const jsonString = JSON.stringify(body);
    if (jsonString.length > 2_000_000) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    const { token, expiresAt } = await storeVtopImport(body);

    return NextResponse.json(
      { token, expiresAt },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to store import." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
