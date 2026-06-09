import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = body?.payload ?? body?.encoded;

    if (typeof payload !== "string" || payload.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (payload.length > 500_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const supabase = createSupabaseAdminClient();
    const id = nanoid(8);
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("share_links").insert({
      id,
      payload,
      expires_at: expiresAt.toISOString()
    });

    if (error) {
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
