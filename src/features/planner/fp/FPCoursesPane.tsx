"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { PLANNER_TABS, PlannerTabId } from "@/features/planner/constants";
import { FPCreditSummary } from "@/features/planner/fp/FPCreditSummary";
import { FPVtopRecommendation } from "@/features/planner/fp/FPVtopRecommendation";
import { FPSearchTab } from "@/features/planner/fp/FPSearchTab";
import { FPPasteTab } from "@/features/planner/fp/FPPasteTab";
import { FPImportTab } from "@/features/planner/fp/FPImportTab";
import { FPCourseList } from "@/features/planner/fp/FPCourseList";
import { FPWeekSoFarPreview } from "@/features/planner/fp/FPWeekSoFarPreview";

/**
 * FPCoursesPane — "01 Courses" tab of /new/planner.
 *
 * Two columns, matching the wireframe: a ~520px course-adding rail on the
 * left (search/paste/import/manual tabs + the always-visible course list),
 * and a persistent "your week so far" live preview on the right that stays
 * in view while the rail scrolls — instead of stacking everything into one
 * long column that forces constant up/down scrolling.
 */
export function FPCoursesPane() {
  const [tab, setTab] = useState<PlannerTabId>("search");
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const campus = useAppStore((state) => state.campus);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <section className="min-w-0 lg:border-r lg:border-fp-border-default">
        <div className="border-b border-fp-border-default px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-fp-display text-[22px] font-bold text-fp-text-strong">Add every course you&apos;re taking</h2>
              <p className="mt-1.5 text-[13px] text-fp-text-dim">
                Tick every professor you&apos;d accept. More ticks, more working weeks.
              </p>
            </div>
            <FPCreditSummary />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {PLANNER_TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "fp-label inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-[7px] text-[11px] transition-colors",
                    active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim hover:text-fp-text-body"
                  )}
                  style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <FPVtopRecommendation campus={campus} hasImportedData={courses.length > 0} />

        <div className="border-b border-fp-border-default lg:border-b-0">
          {tab === "search" ? <FPSearchTab /> : null}
          {tab === "paste" ? <FPPasteTab /> : null}
          {tab === "import" ? <FPImportTab /> : null}
          {tab === "manual" ? <FPCourseList showAddForm /> : null}
        </div>

        {tab !== "manual" ? <FPCourseList showAddForm={false} /> : null}
      </section>

      <aside className="min-w-0 border-t border-fp-border-default bg-fp-bg-surface px-6 py-6 lg:border-t-0">
        <div className="lg:sticky lg:top-6">
          <FPWeekSoFarPreview courses={courses} slots={slots} />
        </div>
      </aside>
    </div>
  );
}
