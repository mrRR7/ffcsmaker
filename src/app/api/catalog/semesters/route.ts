import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "1";
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("semesters")
      .select("id, label, is_active, ffcs_opens, start_date, end_date")
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ semesters: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 500 }
    );
  }
}
