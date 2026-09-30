"use client";

import { memo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useGenerator } from "@/hooks/useGenerator";
import { FPButton } from "@/components/fp-ui/button";
import { FPMetricRun } from "@/components/fp-ui/metric-run";
import { cn } from "@/utils/cn";

const STATES = [
  "Checking every professor combination",
  "Throwing out the clashes",
  "Ranking weeks by gaps and finish time",
  "Grouping weeks by layout"
];
const LONGEST = STATES.reduce((a, b) => (b.length > a.length ? b : a));

// transitions.dev matrix loader, "scan" variant: delay = column * cycle / 10.
const MATRIX_CYCLE_MS = 1200;
function MatrixLoader() {
  return (
    <div className="t-matrix fp-matrix-lg" aria-hidden="true">
      {Array.from({ length: 16 }, (_, idx) => (
        <i key={idx} style={{ ["--d" as string]: String(Math.round((idx % 4) * (MATRIX_CYCLE_MS / 10))) }} />
      ))}
    </div>
  );
}

/**
 * transitions.dev "thinking states": shimmer while a line holds, then swap it
 * up-and-out while the next rises in. The text spans are created and removed
 * imperatively (per the snippet), so React only owns the box + sizer and this
 * is memoised to keep progress re-renders from touching it.
 */
const ThinkingLine = memo(function ThinkingLine() {
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const make = (text: string, entering: boolean) => {
      const span = document.createElement("span");
      span.className = entering ? "t-think-text is-enter-start" : "t-think-text";
      span.textContent = text;
      span.setAttribute("data-text", text);
      box.appendChild(span);
      return span;
    };
    let live = make(STATES[0], false);
    let i = 0;
    let stopped = false;
    const timers: number[] = [];
    // Tokens are scoped to .fp-root, so read them off the box, not <html>.
    const ms = (name: string, fallback: number) => {
      const v = parseFloat(getComputedStyle(box).getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };

    const cycle = () => {
      timers.push(
        window.setTimeout(() => {
          if (stopped) return;
          const swap = ms("--think-swap", 150);
          const gap = ms("--think-gap", 50);
          const leaving = live;
          i = (i + 1) % STATES.length;
          leaving.classList.add("is-exit");
          const next = make(STATES[i], true);
          live = next;
          const release = () => {
            void next.offsetWidth; // flush the enter-start rest state
            next.classList.remove("is-enter-start");
          };
          if (gap > 0) timers.push(window.setTimeout(release, gap));
          else release();
          timers.push(
            window.setTimeout(() => {
              leaving.remove();
              cycle();
            }, swap + gap)
          );
        }, ms("--think-hold", 2000))
      );
    };
    cycle();

    return () => {
      stopped = true;
      timers.forEach((t) => window.clearTimeout(t));
      box.querySelectorAll(".t-think-text").forEach((el) => el.remove());
    };
  }, []);

  return (
    <span ref={boxRef} className="t-think" role="status">
      <span className="t-think-sizer" aria-hidden="true">
        {LONGEST}
      </span>
    </span>
  );
});

/** Shown on /results while the worker searches, then fades out as the table fades in. */
export function GeneratingFP({ leaving }: { leaving: boolean }) {
  const router = useRouter();
  const { checked, accepted } = useAppStore((state) => state.generation);
  const { cancel } = useGenerator();

  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-7 px-4 text-center",
        leaving ? "t-skel-exit" : "t-skel-enter"
      )}
    >
      <MatrixLoader />
      <div className="max-w-full overflow-hidden font-fp-display text-[17px] font-bold sm:text-[22px]">
        <ThinkingLine />
      </div>
      <FPMetricRun
        items={[
          <span key="c" className="font-fp-mono tabular-nums">
            {checked.toLocaleString()} checked
          </span>,
          <span key="a" className="font-fp-mono tabular-nums">
            {accepted.toLocaleString()} {accepted === 1 ? "week" : "weeks"} found
          </span>
        ]}
      />
      {!leaving ? (
        <FPButton
          variant="ghost"
          size="sm"
          onClick={() => {
            cancel();
            router.push("/planner");
          }}
        >
          Cancel
        </FPButton>
      ) : null}
    </div>
  );
}
