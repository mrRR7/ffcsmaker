import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function LegalLayout({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className="space-y-8">{children}</div>
    </div>
  );
}