import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Checkbox — constraint/professor toggle. Unticked = 20x20 box, border-strong.
 * Ticked = accent border + accent-wash-strong fill + unicode check. Labels are
 * passed through verbatim — raw snake_case constraint keys are never prettified.
 */
export interface FPCheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const FPCheckbox = React.forwardRef<HTMLButtonElement, FPCheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex h-5 w-5 flex-none items-center justify-center rounded-[var(--radius-sm)] border text-[13px] leading-none",
        checked
          ? "border-fp-accent text-fp-accent"
          : "border-fp-border-strong",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={checked ? { backgroundColor: "var(--accent-wash-strong)" } : undefined}
      {...props}
    >
      {checked ? "✓" : null}
    </button>
  )
);
FPCheckbox.displayName = "FPCheckbox";
