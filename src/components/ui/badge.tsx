import * as React from "react";
import { cn } from "@/utils/cn";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
}
