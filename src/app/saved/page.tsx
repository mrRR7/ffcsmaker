"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
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
        eyebrow="Library"
        title="Saved Schedules"
        description="Rename, favorite, delete, and reopen local timetables."
      />

      {savedSchedules.length === 0 ? (
        <Card className="flex min-h-96 items-center justify-center text-center">
          <CardContent>
            <p className="text-lg font-semibold">No saved schedules yet.</p>
            <Link
              href="/planner"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Generate schedules
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-3">
            {sorted.map((saved) => (
              <Card key={saved.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Input
                      value={saved.name}
                      onChange={(event) =>
                        renameSavedSchedule(saved.id, event.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant={saved.favorite ? "default" : "outline"}
                      size="icon"
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
                      size="icon"
                      title="Delete"
                      onClick={() => deleteSavedSchedule(saved.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => reopen(saved.id)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Reopen
                    </Button>
                    <Link
                      href="/results"
                      className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold transition hover:bg-secondary/70"
                    >
                      Results
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
