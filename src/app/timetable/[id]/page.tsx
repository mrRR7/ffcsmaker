import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SharedTimetableView } from "./SharedTimetableView";

export const revalidate = 3600; // Cache shared timetables for an hour (or use dynamic)

export default async function SharedTimetablePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("share_timetables")
    .select("snapshot_json")
    .eq("id", params.id)
    .single();

  if (error || !data || !data.snapshot_json) {
    notFound();
  }

  const snapshot = data.snapshot_json as any;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SharedTimetableView snapshot={snapshot} />
    </div>
  );
}
