"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Course, DayOfWeek } from "@/engine/types";
import { generateTimetables } from "@/engine/generator";
import { getSlotCatalog } from "@/engine/slotCatalog";
import { defaultConstraints } from "@/store/useAppStore";
import { BRAND_PALETTE } from "@/lib/coursePalette";
import { buildShapeThumbnail, shortDay, ThumbnailCell } from "@/app/results/resultsVisuals";
import { cn } from "@/utils/cn";

const LAYOUT_COUNT = 4;
const BANDS = 6;
const HOLD_MS = 2600;
const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type SampleCourse = {
  code: string;
  name: string;
  options: Array<{ theory?: string[]; lab?: string[] }>;
};

// A small, made-up course set. Slots are referenced by FFCS label (choosing
// "A1" means every A1 period in the week), then the real generator finds the
// conflict-free layouts — so every week shown is genuinely clash-free.
const SAMPLE_COURSES: SampleCourse[] = [
  { code: "CSE2001", name: "Data Structures", options: [{ theory: ["A1", "TA1"] }, { theory: ["A2", "TA2"] }, { theory: ["F1", "TF1"] }] },
  { code: "MAT2001", name: "Linear Algebra", options: [{ theory: ["B1", "TB1"] }, { theory: ["B2", "TB2"] }, { theory: ["G1", "TG1"] }] },
  { code: "PHY1001", name: "Physics", options: [{ theory: ["C1", "TC1"] }, { theory: ["C2", "TC2"] }, { theory: ["E1", "TE1"] }] },
  { code: "ENG1002", name: "Communication", options: [{ theory: ["D1", "TD1"] }, { theory: ["D2", "TD2"] }] },
  { code: "CSE2002", name: "Programming Lab", options: [{ lab: ["L1 + L2"] }, { lab: ["L13 + L14"] }, { lab: ["L31 + L32"] }] },
  // Afternoon-heavy options so the sample week isn't all mornings.
  { code: "HUM1021", name: "Economics", options: [{ theory: ["E2", "TE2"] }, { theory: ["F2", "TF2"] }, { theory: ["G2", "TG2"] }] },
  { code: "CSE3001", name: "Networks", options: [{ theory: ["A2", "TA2"] }, { theory: ["C2", "TC2"] }, { theory: ["B2", "TB2"] }] }
];

function buildHeroLayouts(): ThumbnailCell[][][] {
  const slots = getSlotCatalog("standard");
  const idsFor = (kind: "theory" | "lab", labels: string[] = []) =>
    slots.filter((slot) => slot.kind === kind && labels.includes(slot.label)).map((slot) => slot.id);

  const courses: Course[] = SAMPLE_COURSES.map((sample, index) => ({
    id: sample.code,
    courseCode: sample.code,
    courseName: sample.name,
    credits: 3,
    color: BRAND_PALETTE[index % BRAND_PALETTE.length],
    options: sample.options.map((option, optionIndex) => ({
      id: `${sample.code}-${optionIndex}`,
      professorName: "Faculty",
      program: null,
      theorySlotIds: idsFor("theory", option.theory),
      labSlotIds: idsFor("lab", option.lab),
      combinedSlotIds: []
    }))
  }));

  const { schedules } = generateTimetables({
    slots,
    courses,
    constraints: defaultConstraints,
    rankingMode: "Balanced",
    maxResults: 80
  });
  if (schedules.length === 0) return [];

  const step = Math.max(1, Math.floor(schedules.length / LAYOUT_COUNT));
  const seen = new Set<string>();
  const layouts: ThumbnailCell[][][] = [];
  for (let i = 0; i < schedules.length && layouts.length < LAYOUT_COUNT; i += step) {
    const grid = buildShapeThumbnail(schedules[i], slots, courses, BANDS);
    const key = grid.map((day) => day.map((cell) => cell.color ?? "-").join("")).join("|");
    if (!seen.has(key)) {
      seen.add(key);
      layouts.push(grid);
    }
  }
  return layouts;
}

export function HeroWeekGrid({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);
  const [layouts, setLayouts] = useState<ThumbnailCell[][][]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLayouts(buildHeroLayouts());
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView || layouts.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((current) => (current + 1) % layouts.length);
      }
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, inView, layouts.length]);

  const layout = layouts[index] ?? [];

  return (
    <div ref={containerRef} className={cn("w-full", className)} aria-hidden="true">
      <div className="rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface p-5">
        <div className="grid grid-cols-5 gap-1.5">
          {DAYS.map((day) => (
            <div key={day} className="fp-code pb-1 text-center text-[length:var(--text-micro)] text-fp-text-dim">
              {shortDay(day)}
            </div>
          ))}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex flex-col gap-1.5">
              {Array.from({ length: BANDS }, (_, band) => {
                const color = layout[dayIndex]?.[band]?.color ?? null;
                if (!color) {
                  return <div key={band} className="h-[22px] rounded-[3px] bg-fp-bg-inset" />;
                }
                return (
                  <motion.div
                    key={`${index}-${dayIndex}-${band}`}
                    className="h-[22px] rounded-[3px]"
                    style={{ background: color }}
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: reduceMotion ? 0 : dayIndex * 0.05 + band * 0.012 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[length:var(--text-micro)] text-fp-text-dim">
        Sample courses. Every layout here avoids clashes.
      </p>
    </div>
  );
}
