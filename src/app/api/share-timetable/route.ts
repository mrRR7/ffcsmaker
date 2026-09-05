import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

// Unauthenticated write endpoint: cap how often one client can create share
// links so it can't be scripted into a storage/cost abuse vector.
const SHARE_CREATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  const { allowed, retryAfterMs } = rateLimit(`share-timetable:${clientIp}`, SHARE_CREATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many share links created. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
      }
    );
  }

  try {
    const body = await req.json();
    const { snapshot } = body;

    if (!snapshot || typeof snapshot !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Keep it relatively small, e.g. 1MB limit for the JSON string
    const jsonString = JSON.stringify(snapshot);
    if (jsonString.length > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const supabase = createSupabaseAdminClient();
    const id = nanoid(10); // User requested 10 chars
    const score = snapshot.schedule?.score ?? 0;

    const { error } = await supabase.from("share_timetables").insert({
      id,
      snapshot_json: snapshot,
      score,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
