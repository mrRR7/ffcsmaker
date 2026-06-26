import { NextResponse } from "next/server";
import type { PlannerImportJSON } from "@/features/vtop-scraper/types";
import { storeVtopImport } from "@/lib/vtopImport/storage";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
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
