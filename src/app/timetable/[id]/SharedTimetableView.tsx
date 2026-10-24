"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPMetricRun } from "@/components/fp-ui/metric-run";
import { FPSlotTable } from "@/components/fp-ui/slot-table";
import { FPSlotMatrixTimetable } from "@/components/fp-ui/slot-matrix-timetable";
import { buildCourseSummaryRows, buildVtopSlotList } from "@/features/results/timetableMatrix";
import { freeDayNames, shortDay } from "@/app/results/resultsVisuals";
import { ScoredTimetable, TimeSlot, Course } from "@/engine/types";

interface Snapshot {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  metrics: ScoredTimetable["metrics"];
  score: number;
  generatedAt: string;
  appVersion?: string;
}

/** "F1 (Mon 08:55…)" → "F1": the code is what goes into VTOP. */
const slotCode = (group: string | undefined) => (group ? group.replace(/\s\(.*\)$/, "") : null);

export function SharedTimetableView({ snapshot }: { snapshot: Snapshot }) {
  const { schedule, slots, courses } = snapshot;
  const { metrics } = schedule;
  const rows = buildCourseSummaryRows(schedule, slots, courses);
  const credits = schedule.selections.reduce((sum, s) => sum + s.credits, 0);
  const freeDays = freeDayNames(schedule, slots);

  function copySlotList() {
    navigator.clipboard
      .writeText(buildVtopSlotList(schedule, slots))
      .then(() => toast.success("Slot list copied."))
      .catch(() => toast.error("Could not copy slot list."));
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0">
          <FPLabel tone="accent" variant="eyebrow">
            Shared week
          </FPLabel>
          <div className="mt-2 flex flex-wrap items-center gap-3.5">
            <h1 className="font-fp-display text-[28px] font-bold text-fp-text-strong sm:text-[length:var(--text-display)]">
              Shared timetable
            </h1>
            <span
              className="rounded-[var(--radius-sm)] px-3 py-1.5 font-fp-mono text-[17px] text-fp-text-accent sm:text-[length:var(--text-h)]"
              style={{ backgroundColor: "var(--accent-wash-strong)" }}
            >
              <span className="mr-1.5 text-[length:var(--text-micro)] uppercase tracking-[.14em] text-fp-text-body">
                score
              </span>
              {Math.round(snapshot.score)}
            </span>
          </div>
          <div className="mt-2">
            <FPMetricRun
              items={[
                freeDays.length > 0
                  ? `${freeDays.map((d) => shortDay(d)).join("+")} free`
                  : `${metrics.halfDays} half day${metrics.halfDays === 1 ? "" : "s"}`,
                `done by ${metrics.latestEndTime}`,
                `${metrics.totalGapSlots} gap${metrics.totalGapSlots === 1 ? "" : "s"}`,
                `${credits} credit${credits === 1 ? "" : "s"}`,
                // Fixed locale and zone, so server and browser render the same text.
                `shared ${new Date(snapshot.generatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Asia/Kolkata"
                })}`
              ]}
            />
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <FPButton variant="secondary" size="sm" onClick={copySlotList}>
            Copy slot list
          </FPButton>
          <Link href="/planner">
            <FPButton variant="primary" size="sm">
              Plan your own week
            </FPButton>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <FPSlotMatrixTimetable schedule={schedule} slots={slots} courses={courses} showHeader={false} />
      </div>

      <section className="mt-7 overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface">
        <div className="flex items-center justify-between border-b border-fp-border-default px-4 py-3">
          <FPLabel tone="strong">Who they&apos;d register with</FPLabel>
          <FPMetricRun items={[`${schedule.selections.length} courses`, `${credits} credits`]} />
        </div>
        <FPSlotTable
          label="Professors and slots for this week"
          columns={[
            {
              key: "course",
              header: "Course",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                  <div className="min-w-0">
                    <div className="font-fp-mono text-[length:var(--text-small)] text-fp-text-strong">
                      {row.courseCode}
                    </div>
                    <div className="truncate text-[12px] text-fp-text-dim">
                      {row.courseName} · {row.credits} cr
                    </div>
                  </div>
                </div>
              )
            },
            { key: "professor", header: "Professor", render: (row) => row.professorName },
            { key: "theory", header: "Theory", render: (row) => slotCode(row.theorySlots[0]) },
            { key: "lab", header: "Lab", render: (row) => slotCode(row.labSlots[0]) }
          ]}
          rows={rows}
          rowKey={(row) => row.courseId}
        />
      </section>
    </main>
  );
}
