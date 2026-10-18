"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { INSTAGRAM_HANDLE, SHOW_WINTER_BANNER } from "@/lib/site";

const DISMISS_KEY = "winter-banner-dismissed";

export function WinterBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      // Storage blocked: the banner just shows again next visit.
    }
  }, []);

  if (!SHOW_WINTER_BANNER || dismissed) return null;

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
        Winter catalog goes live the day VIT releases it. Showing Fall data for now.
        {INSTAGRAM_HANDLE ? (
          <>
            {" "}Follow{" "}
            <a
              href={`https://www.instagram.com/${INSTAGRAM_HANDLE}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fp-text-strong underline underline-offset-2"
            >
              @{INSTAGRAM_HANDLE}
            </a>{" "}
            for the drop.
          </>
        ) : null}
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
