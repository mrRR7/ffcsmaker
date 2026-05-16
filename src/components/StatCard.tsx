import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  className
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
          {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
        </div>
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
