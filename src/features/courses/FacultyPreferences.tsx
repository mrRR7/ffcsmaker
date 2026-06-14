"use client";

import { useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

export function FacultyPreferences({ courseId }: { courseId: string }) {
  const course = useAppStore((state) => state.courses.find((c) => c.id === courseId));
  const constraints = useAppStore((state) => state.constraints);
  const setFacultyRanking = useAppStore((state) => state.setFacultyRanking);
  const setAvoidedFaculty = useAppStore((state) => state.setAvoidedFaculty);

  const ranking = constraints.facultyRanking[courseId] || [];
  const avoided = constraints.avoidedFacultyByCourse[courseId] || [];

  // Auto-initialize ranking
  useEffect(() => {
    if (course && course.options.length >= 2 && ranking.length === 0) {
      setFacultyRanking(courseId, course.options.map((o) => o.id));
    }
  }, [course, courseId, ranking.length, setFacultyRanking]);

  const optionMap = useMemo(() => {
    const map = new Map<string, string>();
    course?.options.forEach((opt) => map.set(opt.id, opt.professorName));
    return map;
  }, [course]);

  if (!course || course.options.length < 2) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRanking = [...ranking];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
    setFacultyRanking(courseId, newRanking);
  };

  const handleMoveDown = (index: number) => {
    if (index === ranking.length - 1) return;
    const newRanking = [...ranking];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
    setFacultyRanking(courseId, newRanking);
  };

  const toggleAvoided = (optionId: string) => {
    if (avoided.includes(optionId)) {
      setAvoidedFaculty(courseId, avoided.filter((id) => id !== optionId));
    } else {
      setAvoidedFaculty(courseId, [...avoided, optionId]);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Faculty Preference</p>
        <p className="text-xs text-muted-foreground mb-3">Rank professors by preference (1 is best)</p>
        <div className="space-y-2">
          {ranking.map((optionId, index) => {
            const name = optionMap.get(optionId);
            if (!name) return null;
            return (
              <div key={optionId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Badge className="border-border/70 bg-secondary/70 shrink-0 min-w-6 justify-center">
                    {index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === ranking.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-border/70">
        <p className="text-sm font-semibold text-foreground mb-2">Avoid Faculty</p>
        <div className="flex flex-wrap gap-2">
          {course.options.map((option) => {
            const isAvoided = avoided.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleAvoided(option.id)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isAvoided
                    ? "bg-destructive/15 border-destructive/30 text-destructive-foreground hover:bg-destructive/20"
                    : "bg-background border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {option.professorName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
