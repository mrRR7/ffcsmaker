"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SHOW_DONATE_BANNER } from "@/lib/site";
import { track } from "@/lib/track";

const DISMISS_KEY = "donate-banner-dismissed";

/** Shown on one results visit only, mounted only on a successful results page. Ignoring it retires it too. */
export function DonateBanner() {
  // Start hidden so a returning visitor never sees it flash before storage is read.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
      // Mark it seen as soon as it shows, so it never comes back even if left alone.
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked: show it; it just won't remember.
    }
    setDismissed(false);
  }, []);

  if (!SHOW_DONATE_BANNER || dismissed) return null;

  const dismiss = () => setDismissed(true);

  return (
    <div className="flex items-start gap-3 border-b border-fp-border-default bg-fp-bg-raised px-4 py-2.5 sm:px-6">
      <p className="flex-1 text-[length:var(--text-small)] leading-[1.5] text-fp-text-dim">
        Ultimate FFCS is free, with no ads or sign-up. If it helped and you feel like it, you can{" "}
        <Link prefetch={false}
          href="/support"
          onClick={() => {
            track("donate_banner_clicked");
            dismiss();
          }}
          // ! beats .fp-root a { text-decoration: none }; without it the link is colour-only.
          className="text-fp-text-body !underline underline-offset-[3px] hover:text-fp-accent"
        >
          chip in
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-m-2 shrink-0 rounded-[var(--radius-sm)] p-2 text-fp-text-dim hover:text-fp-text-body"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
