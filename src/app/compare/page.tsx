"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookmarkPlus, GitCompare, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
import { getAllSchedules, useAppStore } from "@/store/useAppStore";

const metricRows = [
  ["Score", (value: number | string) => value],
  ["Credits", (value: number | string) => value],
  ["Half days", (value: number | string) => value],
  ["Gap slots", (value: number | string) => value],
  ["Latest end", (value: number | string) => value],
  ["Compactness", (value: number | string) => value]
] as const;

export default function ComparePage() {
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const compareScheduleIdsRaw = useAppStore((state) => state.compareScheduleIds);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const removeCompareSchedule = useAppStore((state) => state.removeCompareSchedule);
  const clearCompare = useAppStore((state) => state.clearCompare);
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const savedSchedulesRaw = useAppStore((state) => state.savedSchedules);
  const generatedSchedulesRaw = useAppStore((state) => state.generatedSchedules);
  const compareScheduleIds = Array.isArray(compareScheduleIdsRaw) ? compareScheduleIdsRaw : [];
  const savedSchedules = Array.isArray(savedSchedulesRaw) ? savedSchedulesRaw : [];
  const generatedSchedules = Array.isArray(generatedSchedulesRaw) ? generatedSchedulesRaw : [];
  const allSchedules = useMemo(
    () => getAllSchedules({ generatedSchedules, savedSchedules }),
    [generatedSchedules, savedSchedules]
  );
  const selected = compareScheduleIds
    .map((id) => allSchedules.find((schedule) => schedule.id === id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        eyebrow="Compare"
        title="Schedule Comparison"
        description="Compare up to three timetables using the same theory and lab matrix as Results."
        action={
          <div className="flex flex-wrap gap-2">
            <Select
              className="w-72"
              value=""
              onChange={(event) => {
                if (event.target.value) {
                  addCompareSchedule(event.target.value);
                }
              }}
            >
              <option value="">Add schedule</option>
              {allSchedules.map((schedule, index) => (
                <option key={schedule.id} value={schedule.id}>
                  #{index + 1} - score {schedule.score}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" onClick={clearCompare}>
              Clear
            </Button>
          </div>
        }
      />

      {allSchedules.length === 0 ? (
        <Card className="flex min-h-96 items-center justify-center text-center">
          <CardContent>
            <GitCompare className="mx-auto mb-4 h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">No schedules to compare.</p>
            <Link
              href="/planner"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Generate schedules
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {selected.length === 0 && allSchedules.length > 0 ? (
        <Card className="mb-5">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <Plus className="h-8 w-8 text-primary" />
            <p className="font-semibold">Choose schedules from the selector.</p>
          </CardContent>
        </Card>
      ) : null}

      {selected.length > 0 ? (
        <>
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-3 pr-4">Metric</th>
                    {selected.map((schedule, index) => (
                      <th key={schedule!.id} className="py-3 pr-4">
                        Schedule {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map(([label]) => (
                    <tr key={label} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">{label}</td>
                      {selected.map((schedule) => {
                        const value =
                          label === "Score"
                            ? schedule!.score
                            : label === "Credits"
                              ? schedule!.selections.reduce(
                                  (sum, selection) => sum + selection.credits,
                                  0
                                )
                              : label === "Half days"
                                ? schedule!.metrics.halfDays
                                : label === "Gap slots"
                                  ? schedule!.metrics.totalGapSlots
                                  : label === "Latest end"
                                    ? schedule!.metrics.latestEndTime
                                    : schedule!.metrics.compactness;
                        return (
                          <td key={schedule!.id} className="py-3 pr-4">
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {selected.map((schedule, index) => (
              <div key={schedule!.id} className="space-y-3">
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <Badge>Schedule {index + 1}</Badge>
                      <p className="mt-2 font-semibold">Score {schedule!.score}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          saveSchedule(schedule!);
                          toast.success("Timetable saved locally.");
                        }}
                      >
                        <BookmarkPlus className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Remove"
                        onClick={() => removeCompareSchedule(schedule!.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <SlotMatrixTimetable
                  schedule={schedule!}
                  slots={slots}
                  courses={courses}
                />
                <CourseSummaryPanel
                  schedule={schedule!}
                  slots={slots}
                  courses={courses}
                  highlightCourseCode={null}
                  previewCourseCode={null}
                  onHighlightCourseCodeChange={() => undefined}
                  onPreviewCourseCodeChange={() => undefined}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
