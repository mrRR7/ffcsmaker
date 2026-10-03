"use client";

import * as React from "react";
import { X } from "lucide-react";
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
 * stuck. Not rendered once dismissed or when the user hides all tips in
 * Settings. Visibility is only known after mount (dismissals live in
 * localStorage), so instead of popping in and shoving content down, it mounts
 * open and plays the accordion expand as a CSS keyframe (.t-acc-enter in
 * fp-transitions.css). No JS timing involved, so it can't get stuck hidden.
 * Dismissing collapses it with the regular .t-acc transition.
 */
export function FPTip({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const [state, setState] = React.useState<"hidden" | "closed" | "open">("hidden");

  React.useEffect(() => {
    if (read(TIPS_HIDDEN_KEY) !== "true" && read(TIP_PREFIX + id) !== "true") setState("open");
  }, [id]);

  if (state === "hidden") return null;

  const open = state === "open";

  function dismiss() {
    try {
      window.localStorage.setItem(TIP_PREFIX + id, "true");
    } catch {
      // storage blocked: hide for this visit only
    }
    setState("closed");
  }

  return (
    <div className="t-acc t-acc-enter" data-open={String(open)} aria-hidden={!open}>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          {/* className (usually mt-*) sits inside the collapsing panel so the
              gap animates with the tip instead of appearing instantly. */}
          <div className={className}>
            <div
              className="flex items-start gap-3 rounded-[var(--radius-md)] border border-fp-border-default px-3.5 py-3 text-[length:var(--text-small)] leading-[1.5] text-fp-text-body"
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
                tabIndex={open ? undefined : -1}
                className="-m-1.5 shrink-0 p-1.5 text-fp-text-dim hover:text-fp-text-body"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
