"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useTour } from "@/features/tour/useTour";
import { cn } from "@/utils/cn";
import { PLANNER_TABS, PlannerTabId } from "@/features/planner/constants";
import { FPCreditSummary } from "@/features/planner/fp/FPCreditSummary";
import { FPVtopRecommendation } from "@/features/planner/fp/FPVtopRecommendation";
import { FPSearchTab } from "@/features/planner/fp/FPSearchTab";
import { FPPasteTab } from "@/features/planner/fp/FPPasteTab";
import { FPImportTab } from "@/features/planner/fp/FPImportTab";
import { FPCourseList } from "@/features/planner/fp/FPCourseList";
import { FPLiveSlotMatrix } from "@/features/planner/fp/FPLiveSlotMatrix";

const DEFAULT_RAIL_WIDTH = 400;
const MIN_RAIL_WIDTH = 340;
const MAX_RAIL_WIDTH = 480;
const RAIL_WIDTH_STORAGE_KEY = "fp_planner_rail_width";

function clampRailWidth(width: number) {
  return Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, width));
}

/**
 * FPCoursesPane — "01 Courses" tab of /planner.
 *
 * Two columns: a resizable rail on the left holding course-adding controls
 * (search/paste/import/manual tabs), and the live FFCS preview grid on
 * the right with the added-courses boxes underneath it — the whole pane
 * scrolls normally with the page, nothing pinned.
 */
export function FPCoursesPane({
  actions,
}: { actions?: ReactNode } = {}) {
  const [tab, setTab] = useState<PlannerTabId>("search");
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const campus = useAppStore((state) => state.campus);
  const tour = useTour();

  const [railWidth, setRailWidth] = useState(DEFAULT_RAIL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, width: DEFAULT_RAIL_WIDTH });

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(RAIL_WIDTH_STORAGE_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      setRailWidth(clampRailWidth(stored));
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event: PointerEvent) {
      const delta = event.clientX - dragStartRef.current.x;
      setRailWidth(clampRailWidth(dragStartRef.current.width + delta));
    }
    function handlePointerUp() {
      setIsDragging(false);
      setRailWidth((current) => {
        window.localStorage.setItem(RAIL_WIDTH_STORAGE_KEY, String(current));
        return current;
      });
    }

    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  function handleDividerPointerDown(event: ReactPointerEvent) {
    dragStartRef.current = { x: event.clientX, width: railWidth };
    setIsDragging(true);
  }

  function handleDividerDoubleClick() {
    setRailWidth(DEFAULT_RAIL_WIDTH);
    window.localStorage.setItem(RAIL_WIDTH_STORAGE_KEY, String(DEFAULT_RAIL_WIDTH));
  }

  return (
    <div
      className="flex flex-col lg:grid lg:items-start"
      style={{ gridTemplateColumns: `minmax(0, ${railWidth}px) 6px minmax(0, 1fr)` }}
    >
      <section className="min-w-0">
        <div className="border-b border-fp-border-default px-4 py-4 lg:px-6 lg:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-fp-display text-[22px] font-bold text-fp-text-strong">Add every course you&apos;re taking</h2>
              <p className="mt-1.5 hidden text-[length:var(--text-small)] text-fp-text-dim sm:block">
                Tick every professor you&apos;d accept. More ticks, more working weeks.
              </p>
            </div>
            <FPCreditSummary />
          </div>

          <div data-tour-id="planner-add-courses" className="mt-5 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PLANNER_TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "fp-text shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-[7px] text-[length:var(--text-small)] transition-colors",
                    active ? "text-fp-text-strong font-medium" : "text-fp-text-dim hover:text-fp-text-body"
                  )}
                  style={active ? { backgroundColor: "var(--surface-selected)" } : undefined}
                >
                  {/* Short labels so all four fit on one row in the rail. */}
                  {item.mobileLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {tab === "search" ? <FPSearchTab /> : null}
          {tab === "paste" ? <FPPasteTab /> : null}
          {tab === "import" ? <FPImportTab /> : null}
          {tab === "manual" ? <FPCourseList showAddForm showList={false} /> : null}
        </div>

        {/* Below the input, not above it: the search box is the first thing
            a student needs; this is the fallback when the catalog misses. */}
        {!tour.active ? (
          <FPVtopRecommendation campus={campus} hasImportedData={courses.length > 0} />
        ) : null}

      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={handleDividerPointerDown}
        onDoubleClick={handleDividerDoubleClick}
        className="group hidden touch-none items-stretch justify-center lg:flex lg:cursor-col-resize lg:self-stretch"
      >
        <div
          className={cn(
            "h-full w-px transition-colors",
            isDragging ? "bg-[var(--border-selected)]" : "bg-transparent group-hover:bg-fp-border-strong"
          )}
        />
      </div>

      {/* Phone: the 860px live grid is unreadable at 375px and Results shows the real one,
          so drop it; search stays first and "your courses" appears below it once non-empty. */}
      <aside
        className={cn(
          "min-w-0 border-t border-fp-border-default bg-fp-bg-surface px-4 py-4 lg:border-t-0 lg:px-6 lg:py-6",
          courses.length === 0 && "hidden lg:block"
        )}
      >
        <div className="hidden lg:block">
          <FPLiveSlotMatrix courses={courses} slots={slots} actions={actions} />
        </div>
        <div className="lg:mt-6 lg:border-t lg:border-fp-border-default lg:pt-6">
          <FPCourseList showAddForm={false} showList />
        </div>
      </aside>
    </div>
  );
}
