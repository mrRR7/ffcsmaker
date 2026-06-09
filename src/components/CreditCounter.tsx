import { Course } from "@/engine/types";
import { cn } from "@/utils/cn";

const VIT_CREDIT_CAP = 27;

export function CreditCounter({ courses }: { courses: Course[] }) {
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
  const percentage = (totalCredits / VIT_CREDIT_CAP) * 100;
  const isOver = totalCredits > VIT_CREDIT_CAP;
  const isNear = totalCredits >= VIT_CREDIT_CAP - 3;

  return (
    <div className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background/30 px-3">
      <span
        className={cn(
          "text-sm font-medium",
          isOver
            ? "text-destructive"
            : isNear
              ? "text-amber-400"
              : "text-muted-foreground"
        )}
      >
        {totalCredits} / {VIT_CREDIT_CAP} credits
      </span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-destructive" : isNear ? "bg-amber-400" : "bg-primary"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isOver ? <span className="text-xs text-destructive">Over limit</span> : null}
    </div>
  );
}
