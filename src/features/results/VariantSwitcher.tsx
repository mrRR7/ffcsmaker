"use client";

import { useMemo } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Course, ScoredTimetable, TimetableShapeGroup } from "@/engine/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";

interface VariantSwitcherProps {
  group: TimetableShapeGroup;
  activeScheduleId: string;
  courses: Course[];
  onSelect: (scheduleId: string) => void;
}

export function VariantSwitcher({ group, activeScheduleId, courses, onSelect }: VariantSwitcherProps) {
  const allSchedules = useMemo(() => {
    // representative is always first, followed by alternatives
    const map = new Map<string, ScoredTimetable>();
    map.set(group.representative.id, group.representative);
    group.alternatives.forEach(alt => map.set(alt.id, alt));
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [group]);

  const diffs = useMemo(() => {
    return allSchedules.map(schedule => {
      const changed: { courseCode: string; from: string; to: string }[] = [];
      
      // Compare to representative
      schedule.selections.forEach(sel => {
        const repSel = group.representative.selections.find(s => s.courseId === sel.courseId);
        if (repSel && repSel.optionId !== sel.optionId) {
          changed.push({
            courseCode: sel.courseCode,
            from: repSel.professorName,
            to: sel.professorName
          });
        }
      });
      
      return { schedule, changed };
    });
  }, [allSchedules, group.representative]);

  if (allSchedules.length <= 1) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max px-1">
        {diffs.map(({ schedule, changed }, index) => {
          const isActive = schedule.id === activeScheduleId;
          const isBestFaculty = group.bestFacultyVariant?.id === schedule.id;

          return (
            <button
              key={schedule.id}
              onClick={() => onSelect(schedule.id)}
              className={cn(
                "flex flex-col text-left rounded-xl border p-3 transition-all",
                isActive
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:bg-secondary/60 hover:border-border/80"
              )}
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                  Variant {index + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge className="text-xs bg-background text-muted-foreground border-border/70 hover:bg-background">
                    Score {schedule.score}
                  </Badge>
                  {isBestFaculty && (
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                      Best Faculty
                    </Badge>
                  )}
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-1" />}
                </div>
              </div>
              
              <div className="text-xs space-y-1 mt-auto">
                {changed.length === 0 ? (
                  <span className="text-muted-foreground italic">Representative schedule</span>
                ) : (
                  changed.map((change, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-medium text-foreground">{change.courseCode}</span>
                      <span className="max-w-[120px] truncate">{change.from}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className={cn("font-medium max-w-[120px] truncate", isActive ? "text-primary" : "text-foreground")}>
                        {change.to}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
