"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Heart, Trash2, GalleryVerticalEnd } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { useAppStore } from "@/store/useAppStore";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
import { cn } from "@/utils/cn";

export default function SavedPage() {
  const router = useRouter();
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const savedSchedules = useAppStore((state) => state.savedSchedules);
  const deleteSavedSchedule = useAppStore((state) => state.deleteSavedSchedule);
  const renameSavedSchedule = useAppStore((state) => state.renameSavedSchedule);
  const toggleFavoriteSchedule = useAppStore((state) => state.toggleFavoriteSchedule);

  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);
  const sorted = [...savedSchedules].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt)
  );
  const featured = sorted[0]?.timetable ?? null;

  function reopen(scheduleId: string) {
    const saved = savedSchedules.find((item) => item.id === scheduleId);
    if (!saved) {
      return;
    }
    setGeneratedSchedules([saved.timetable]);
    toast.success("Schedule reopened in results.");
    router.push("/results");
  }

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        title="Saved"
      />

      {savedSchedules.length === 0 ? (
        <Card className="flex min-h-96 items-center justify-center text-center border-primary/20 bg-primary/5">
          <CardContent className="max-w-md">
            <GalleryVerticalEnd className="mx-auto mb-4 h-10 w-10 text-primary/70" />
            <p className="text-lg font-semibold">No saved schedules yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Save schedules to view them here.
            </p>
            <Link
              href="/planner"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-hover transition"
            >
              Open Planner
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="flex flex-col rounded-md border border-hairline bg-surface-card divide-y divide-hairline">
            {sorted.map((saved) => (
              <div key={saved.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={saved.name}
                    className="h-8 bg-canvas"
                    onChange={(event) =>
                      renameSavedSchedule(saved.id, event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant={saved.favorite ? "default" : "secondary"}
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Favorite"
                    onClick={() => toggleFavoriteSchedule(saved.id)}
                  >
                    <Heart
                      className={cn("h-4 w-4", saved.favorite && "fill-current")}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Delete"
                    onClick={() => deleteSavedSchedule(saved.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Score {saved.timetable.score}</Badge>
                    <Badge>
                      {saved.timetable.selections.reduce(
                        (sum, selection) => sum + selection.credits,
                        0
                      )}{" "}
                      credits
                    </Badge>
                    <Badge>
                      {formatDistanceToNow(new Date(saved.updatedAt), {
                        addSuffix: true
                      })}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => reopen(saved.id)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Reopen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <SlotMatrixTimetable schedule={featured} slots={slots} courses={courses} />
            {featured ? (
              <CourseSummaryPanel
                schedule={featured}
                slots={slots}
                courses={courses}
                highlightCourseCode={null}
                previewCourseCode={null}
                onHighlightCourseCodeChange={() => undefined}
                onPreviewCourseCodeChange={() => undefined}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
