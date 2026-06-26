import { useState } from "react";
import { Info, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogSearch } from "@/features/catalog/CatalogSearch";
import { PasteImport } from "@/features/paste-import/PasteImport";
import { ImportManager } from "@/features/import/ImportManager";
import { CourseBuilder } from "@/features/courses/CourseBuilder";
import { CreditCounter } from "@/components/CreditCounter";
import { useAppStore } from "@/store/useAppStore";
import { PLANNER_TABS, PlannerTabId } from "../constants";
import { cn } from "@/utils/cn";

interface StepCoursesProps {
  showNotice: boolean;
  onDismissNotice: () => void;
}

export function StepCourses({ showNotice, onDismissNotice }: StepCoursesProps) {
  const courses = useAppStore((state) => state.courses);
  const [tab, setTab] = useState<PlannerTabId>("search");

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Pinned Credit Counter for mobile */}
      <div className="flex justify-end">
        <CreditCounter courses={courses} />
      </div>

      {showNotice ? (
        <Card className="border-primary/20 bg-primary/5 shadow-none relative overflow-hidden">
          <CardContent className="p-4 flex gap-3 text-sm text-ink pr-10">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Notice</h4>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>Ultimate FFCS is currently in an early rollout phase.</p>
                <p>
                  At the moment, faculty and course data has only been uploaded for
                  2nd Year Computer Science and Engineering (Core) students.
                </p>
                <p>
                  Additional catalog coverage is actively being added and will be
                  rolled out soon.
                </p>
                <p>
                  If you have access to faculty/course allocation data that is missing here,
                  please get in touch. Community-contributed data will help expand
                  support significantly faster.
                </p>
                <p>Thank you for your patience while the catalog is being expanded.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissNotice}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-surface-soft hover:text-ink transition"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-lg border border-hairline bg-canvas/30 p-1">
        {PLANNER_TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium leading-tight transition flex-1 justify-center sm:flex-none sm:justify-start",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent bg-transparent text-muted hover:bg-surface-soft/40 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{item.mobileLabel}</span>
            </button>
          );
        })}
      </div>

      <div>
        {tab === "search" ? <CatalogSearch /> : null}
        {tab === "paste" ? <PasteImport /> : null}
        {tab === "import" ? <ImportManager /> : null}
      </div>

      <div className={cn(
        tab !== "manual" ? "[&>div>div:first-child]:hidden mt-8 pt-4 border-t border-hairline" : ""
      )}>
        {tab !== "manual" && courses.length > 0 && (
          <h2 className="text-sm font-medium text-muted mb-4">
            Added courses ({courses.length})
          </h2>
        )}
        <CourseBuilder />
      </div>
    </div>
  );
}
