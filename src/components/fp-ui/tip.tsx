"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";

const TIP_PREFIX = "fp_tip_dismissed:";
// Shared with the planner's first-time banner so Settings → "First-time tips" toggles both.
export const TIPS_HIDDEN_KEY = "dismissed_preliminary_notice";

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Settings → "Show": bring back every dismissed tip. */
export function resetTips() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(TIP_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // storage blocked: tips just stay as they are
  }
}

/**
 * FPTip — a short, dismissible pointer placed right where a first-timer gets
 * stuck. Hidden until mount (dismissals live in localStorage), once dismissed,
 * or when the user hides all tips in Settings.
 */
export function FPTip({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(read(TIPS_HIDDEN_KEY) !== "true" && read(TIP_PREFIX + id) !== "true");
  }, [id]);

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(TIP_PREFIX + id, "true");
    } catch {
      // storage blocked: hide for this visit only
    }
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border border-fp-border-default px-3.5 py-3 text-[length:var(--text-small)] leading-[1.5] text-fp-text-body",
        className
      )}
      style={{ backgroundColor: "var(--accent-wash)" }}
    >
      <FPLabel tone="accent" className="mt-px shrink-0">
        Tip
      </FPLabel>
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="-m-1.5 shrink-0 p-1.5 text-fp-text-dim hover:text-fp-text-body"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
