import { Course } from "@/engine/types";
import { cn } from "@/utils/cn";

const VIT_CREDIT_CAP = 27;

export function CreditCounter({ courses }: { courses: Course[] }) {
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
  const percentage = (totalCredits / VIT_CREDIT_CAP) * 100;
  const isOver = totalCredits > VIT_CREDIT_CAP;
  const isNear = totalCredits >= VIT_CREDIT_CAP - 3;

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-card px-2 py-0.5 text-[12px] font-medium leading-tight text-ink">
      <span
        className={cn(
          isOver
            ? "text-error"
            : isNear
              ? "text-warning"
              : "text-muted"
        )}
      >
        {totalCredits} / {VIT_CREDIT_CAP} cr
      </span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-soft border border-hairline-soft">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-error" : isNear ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isOver ? <span className="text-[10px] font-medium text-error uppercase tracking-wider">Over</span> : null}
    </div>
  );
}
