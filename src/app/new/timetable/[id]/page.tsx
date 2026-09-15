import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SharedTimetableView } from "@/app/timetable/[id]/SharedTimetableView";

export const revalidate = 3600;

export default async function NewSharedTimetablePage({ params }: { params: { id: string } }) {
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
    <div className="-mx-4 -my-8 min-h-screen bg-fp-bg-page text-fp-text-body sm:-mx-6 lg:-mx-8">
      {/*
        Reuses the classic SharedTimetableView as-is for now (guarantees the
        share flow keeps working end-to-end). Restyling this to the fp-ui
        primitives is a good follow-up once the /new/results grid components
        (built separately) are available to share with this route.
      */}
      <SharedTimetableView snapshot={snapshot} />
    </div>
  );
}
