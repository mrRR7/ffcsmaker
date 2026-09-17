import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Button — the only action control in the FFCS Planner system.
 * Mono, uppercase, .14em tracked. Exact spec from the design handoff's own
 * component bundle (components/core/Button.jsx): primary/secondary/ghost,
 * sm/md sizes, hover = raise a value step or brighten accent, never opacity.
 */
const fpButtonVariants = cva(
  "fp-text inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-transparent leading-none transition-[background-color,border-color,color,transform,outline-offset] duration-[var(--dur-fast)] ease-[var(--ease-standard)] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-fp-border-default disabled:bg-fp-bg-inset disabled:text-fp-text-dim disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary: "bg-fp-accent text-fp-text-on-accent font-medium hover:bg-fp-accent-bright",
        secondary: "bg-fp-bg-raised text-fp-text-body hover:bg-fp-bg-inset",
        ghost: "bg-transparent text-fp-text-dim hover:text-fp-text-body"
      },
      size: {
        sm: "text-[length:var(--text-micro)] px-3 py-[7px]",
        md: "text-[length:var(--text-small)] px-[18px] py-[11px]"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface FPButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fpButtonVariants> {
  /** Shows a spinner and disables the button — for actions with a real wait (network, computation). */
  loading?: boolean;
}

export const FPButton = React.forwardRef<HTMLButtonElement, FPButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(fpButtonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
      {children}
    </button>
  )
);
FPButton.displayName = "FPButton";
