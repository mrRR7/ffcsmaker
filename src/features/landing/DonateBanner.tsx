"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SHOW_DONATE_BANNER } from "@/lib/site";
import { track } from "@/lib/track";

const DISMISS_KEY = "donate-banner-dismissed";

/** One-time ask, mounted only on a successful results page. Dismissing or tapping Support both retire it. */
export function DonateBanner() {
  // Start hidden so a returning visitor never sees it flash before storage is read.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setDismissed(false);
    } catch {
      // Storage blocked: show it; it just won't remember.
      setDismissed(false);
    }
  }, []);

  if (!SHOW_DONATE_BANNER || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore.
    }
  }

  return (
    <div className="flex items-start gap-3 border-b border-fp-border-default bg-fp-bg-raised px-4 py-2.5 sm:px-6">
      <p className="flex-1 text-[length:var(--text-small)] leading-[1.5] text-fp-text-body">
        Ultimate FFCS is free and built by a student. If it saved you time, any amount helps keep it running.{" "}
        <Link
          href="/support"
          onClick={() => {
            track("donate_banner_clicked");
            dismiss();
          }}
          // ! beats .fp-root a { text-decoration: none }; without it the link is colour-only.
          className="text-fp-text-strong !underline underline-offset-[3px] hover:text-fp-accent"
        >
          Support
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-m-1 shrink-0 rounded-[var(--radius-sm)] p-1 text-fp-text-dim hover:text-fp-text-body"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
