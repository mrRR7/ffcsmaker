import Link from "next/link";
import { ClipboardCheck, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface StepReviewProps {
  onGoToStep: (step: 1 | 2 | 3) => void;
  isGenerating: boolean;
  progress: number;
  checked: number;
  accepted: number;
}

export function StepReview({
  onGoToStep,
  isGenerating,
  progress,
  checked,
  accepted,
}: StepReviewProps) {
  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);

  const activeConstraintCount = Object.values(constraints).filter(Boolean).length;
  const optionCount = courses.reduce((sum, course) => sum + course.options.length, 0);

  if (courses.length === 0) {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted/50" />
        <div>
          <p className="font-medium">No courses added</p>
          <p className="text-sm text-muted-foreground mt-1">
            You need to add at least one course to generate a schedule.
          </p>
        </div>
        <Button variant="outline" onClick={() => onGoToStep(1)} className="mt-2">
          ← Add courses
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {isGenerating || checked > 0 ? (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Checked {checked} branches, accepted {accepted}
              </span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            {accepted > 0 && !isGenerating ? (
              <Link
                href="/results"
                className="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-none transition hover:bg-primary-hover"
              >
                Open Results
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4 flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-soft flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-ink" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{courses.length} Courses</h3>
              <button
                onClick={() => onGoToStep(1)}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {optionCount} professor options total
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {courses.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex rounded-md bg-canvas border border-hairline px-2 py-0.5 text-[11px] font-medium"
                >
                  {c.id}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-soft flex items-center justify-center">
            <SlidersHorizontal className="h-5 w-5 text-ink" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Constraints</h3>
              <button
                onClick={() => onGoToStep(2)}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeConstraintCount === 0
                ? "No active constraints"
                : `${activeConstraintCount} active constraint${activeConstraintCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
