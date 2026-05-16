import { cn } from "@/utils/cn";

export function Progress({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
