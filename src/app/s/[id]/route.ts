import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { id?: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.redirect(new URL("/planner", _req.url));
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("share_links")
      .select("payload, expires_at, view_count")
      .eq("id", id)
      .single();

    if (error || !data || new Date(data.expires_at) < new Date()) {
      return NextResponse.redirect(new URL("/planner?share_expired=1", _req.url));
    }

    void supabase
      .from("share_links")
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq("id", id);

    const url = new URL("/planner", _req.url);
    url.searchParams.set("share", data.payload);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/planner?share_expired=1", _req.url));
  }
}
