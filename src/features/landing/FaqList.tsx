"use client";

import { useState } from "react";

/**
 * transitions.dev accordion (grid-rows 0fr ↔ 1fr + chevron scaleY flip).
 * Answers stay in the server-rendered HTML (just collapsed), so they're still
 * indexable — same as the <details> this replaces.
 */
export function FaqList({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-5 divide-y divide-fp-border-default border-y border-fp-border-default">
      {faqs.map((faq, index) => {
        const isOpen = open === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div key={faq.q} className="t-acc" data-open={String(isOpen)}>
            <button
              type="button"
              className="t-acc-head flex w-full items-center justify-between gap-4 py-4 text-left text-[length:var(--text-body-size)] font-medium text-fp-text-strong hover:text-fp-accent"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              {faq.q}
              <span className="t-acc-chevron text-fp-text-dim" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6.5L8 10.5L12 6.5" />
                </svg>
              </span>
            </button>
            <div className="t-acc-panel" id={panelId}>
              <div className="t-acc-panel-inner">
                <p className="max-w-2xl pb-4 text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
