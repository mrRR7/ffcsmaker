import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Note — accent-left-bar helper text that explains a consequence, not a
 * reassurance. `tone="warn"` swaps the bar/text to the warn color.
 */
export interface FPNoteProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: "default" | "warn";
}

export function FPNote({ className, tone = "default", ...props }: FPNoteProps) {
  return (
    <p
      className={cn(
        "border-l-2 pl-4 text-[var(--text-small)] leading-[1.5]",
        tone === "warn" ? "border-fp-warn text-fp-warn" : "border-fp-accent text-fp-text-dim",
        className
      )}
      {...props}
    />
  );
}
