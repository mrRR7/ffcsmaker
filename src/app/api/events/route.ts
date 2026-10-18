import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { sanitizeUsageEvent } from "@/lib/usageEvents";

// Anonymous usage counter. Stores only the allowlisted event name, campus and
// props; the IP is used as an in-memory rate-limit key and never written anywhere.
const EVENTS_LIMIT = { max: 60, windowMs: 60 * 1000 };
const MAX_BODY_CHARS = 1024;

export async function POST(request: Request) {
  if (!rateLimit(`events:${getClientIp(request)}`, EVENTS_LIMIT).allowed) {
    return new NextResponse(null, { status: 429 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) {
    return new NextResponse(null, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return new NextResponse(null, { status: 413 });
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Falls through to the 400 below.
  }
  const row = sanitizeUsageEvent(parsed);
  if (!row) {
    return new NextResponse(null, { status: 400 });
  }

  const { error } = await createSupabaseAdminClient().from("usage_events").insert(row);
  if (error) {
    console.error("usage event insert failed:", error.message);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
