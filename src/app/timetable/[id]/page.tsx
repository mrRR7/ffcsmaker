import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SharedTimetableView } from "./SharedTimetableView";

export const revalidate = 3600;

// cache() so generateMetadata and the page share one query per request.
const getSnapshot = cache(async (id: string) => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_timetables")
    .select("snapshot_json")
    .eq("id", id)
    .single();
  return error || !data?.snapshot_json ? null : (data.snapshot_json as any);
});

// Shared weeks are personal and thin: good link previews, but kept out of the index.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getSnapshot(id);
  if (!snapshot) {
    return { title: "Timetable not found", robots: { index: false, follow: false } };
  }
  const courses: Array<{ credits?: number }> = snapshot.courses ?? [];
  const credits = courses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const title = `Shared FFCS timetable: ${courses.length} courses, ${credits} credit${credits === 1 ? "" : "s"}`;
  const description = "A clash-free VIT FFCS timetable built with Ultimate FFCS. Open it to see the full week.";
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, url: `/timetable/${id}`, images: ["/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] }
  };
}

export default async function NewSharedTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getSnapshot(id);

  if (!snapshot) {
    notFound();
  }

  return (
    <div className="-mx-4 -my-8 min-h-screen bg-fp-bg-page text-fp-text-body sm:-mx-6 lg:-mx-8">
      <SharedTimetableView snapshot={snapshot} />
    </div>
  );
}
