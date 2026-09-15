import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

/**
 * Button — the only action control in the FFCS Planner system.
 * Mono, uppercase, .14em tracked. Exact spec from the design handoff's own
 * component bundle (components/core/Button.jsx): primary/secondary/ghost,
 * sm/md sizes, hover = raise a value step or brighten accent, never opacity.
 */
const fpButtonVariants = cva(
  "fp-label inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-transparent leading-none transition-[background-color,border-color,color,transform] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-fp-border-default disabled:bg-fp-bg-inset disabled:text-fp-text-dim disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary: "bg-fp-accent text-fp-text-on-accent font-medium hover:bg-fp-accent-bright",
        secondary:
          "bg-transparent text-fp-text-body border-fp-border-strong hover:bg-fp-bg-raised hover:border-fp-accent",
        ghost: "bg-transparent text-fp-text-dim hover:text-fp-text-body"
      },
      size: {
        sm: "text-[11px] px-3 py-[7px]",
        md: "text-[13px] px-[18px] py-[11px]"
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
    VariantProps<typeof fpButtonVariants> {}

export const FPButton = React.forwardRef<HTMLButtonElement, FPButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(fpButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
FPButton.displayName = "FPButton";
