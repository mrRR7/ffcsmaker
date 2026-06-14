"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Course, ScoredTimetable, TimetableShapeGroup } from "@/engine/types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface VariantSwitcherProps {
  group: TimetableShapeGroup;
  activeVariantId: string;
  courses: Course[];
  onSelectVariant: (variantId: string) => void;
}

export function VariantSwitcher({ group, activeVariantId, courses, onSelectVariant }: VariantSwitcherProps) {
  const allSchedules = useMemo(() => {
    // representative is always first, followed by alternatives
    const map = new Map<string, ScoredTimetable>();
    map.set(group.representative.id, group.representative);
    group.alternatives.forEach(alt => map.set(alt.id, alt));
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [group]);

  const activeIndex = useMemo(() => {
    return allSchedules.findIndex(s => s.id === activeVariantId);
  }, [allSchedules, activeVariantId]);

  const activeSchedule = allSchedules[activeIndex] ?? allSchedules[0];

  const diffs = useMemo(() => {
    if (!activeSchedule) return [];
    
    const changed: { courseCode: string; from: string; to: string }[] = [];
    
    // Compare to representative
    activeSchedule.selections.forEach(sel => {
      const repSel = group.representative.selections.find(s => s.courseId === sel.courseId);
      if (repSel && repSel.optionId !== sel.optionId) {
        changed.push({
          courseCode: sel.courseCode,
          from: repSel.professorName,
          to: sel.professorName
        });
      }
    });
    
    return changed;
  }, [activeSchedule, group.representative]);

  if (allSchedules.length <= 1) {
    return null;
  }

  const handlePrevious = () => {
    const prevIndex = Math.max(0, activeIndex - 1);
    onSelectVariant(allSchedules[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = Math.min(allSchedules.length - 1, activeIndex + 1);
    onSelectVariant(allSchedules[nextIndex].id);
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur mb-6">
      <div className="flex flex-col gap-4">
        
        {/* Top Header: Select + Badges */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Select
              value={activeSchedule.id}
              onChange={(e) => onSelectVariant(e.target.value)}
              className="w-[180px] font-medium bg-background"
            >
              {allSchedules.map((schedule, idx) => (
                <option key={schedule.id} value={schedule.id}>
                  Variant {idx + 1} of {allSchedules.length}
                </option>
              ))}
            </Select>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-background text-foreground border border-border/70 shadow-none hover:bg-background">
                Score {activeSchedule.score}
              </Badge>
              {activeSchedule.scoreBreakdown?.facultyPreference !== undefined && (
                <Badge className="bg-background text-muted-foreground border border-border/70 shadow-none hover:bg-background">
                  Faculty Score {Math.round(activeSchedule.scoreBreakdown.facultyPreference)}
                </Badge>
              )}
              {group.bestFacultyVariant?.id === activeSchedule.id && (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                  Best Faculty
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Diff Content */}
        <div className="rounded-lg bg-background border border-border/50 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Faculty Changes</h4>
          {diffs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              This is the reference variant. No faculty changes.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {diffs.map((change, i) => (
                <li key={i} className="text-sm flex items-center gap-2 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  <span className="font-medium text-foreground">{change.courseCode}:</span>
                  <span className="truncate">{change.from}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-primary truncate">{change.to}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={activeIndex <= 0}
            className="w-28 bg-background"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-xs font-medium text-muted-foreground">
            {activeIndex + 1} / {allSchedules.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={activeIndex >= allSchedules.length - 1}
            className="w-28 bg-background"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

      </div>
    </div>
  );
}
