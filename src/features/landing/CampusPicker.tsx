"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { FPButton } from "@/components/fp-ui/button";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { useAppStore } from "@/store/useAppStore";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";
import { BRAND_PALETTE } from "@/lib/coursePalette";
import { useTour } from "@/features/tour/useTour";
import { hasSeenTour } from "@/features/tour/tourStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const campusCards: Array<{ campus: Campus; active: boolean; detail: string; swatch: string }> = [
  { campus: "chennai", active: true, detail: "Mon–Fri slot catalog", swatch: BRAND_PALETTE[0] },
  { campus: "vellore", active: true, detail: "Mon–Fri slot catalog", swatch: BRAND_PALETTE[1] },
  { campus: "bhopal", active: true, detail: "Bhopal slot catalog", swatch: BRAND_PALETTE[2] },
  { campus: "ap", active: false, detail: "AP slot catalog in progress", swatch: BRAND_PALETTE[3] }
];

export function CampusPicker() {
  const router = useRouter();
  const campus = useAppStore((state) => state.campus);
  const setCampus = useAppStore((state) => state.setCampus);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const courseCount = useAppStore((state) => state.courses.length);
  const tour = useTour();
  const [tourPromptDismissed, setTourPromptDismissed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const showTourPrompt =
    hasHydrated && isMobile === false && !tour.active && !tourPromptDismissed && !hasSeenTour();

  function pickCampus(next: Campus) {
    setCampus(next);
    router.push("/planner");
  }

  const returning = hasHydrated && campus && courseCount > 0;

  return (
    <>
      {returning ? (
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <FPButton variant="primary" onClick={() => router.push("/planner")}>
            Continue planning · {courseCount} course{courseCount === 1 ? "" : "s"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </FPButton>
          <span className="text-[length:var(--text-small)] text-fp-text-dim">or switch campus below</span>
        </div>
      ) : (
        // Returning users already have a campus; only ask first-timers.
        <p className="mt-2 text-[length:var(--text-body-size)] text-fp-text-body">First &mdash; which campus?</p>
      )}
      <motion.div
        data-tour-id="home-cta"
        className={cn(
          "grid w-full max-w-4xl grid-cols-1 gap-4 text-left min-[480px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-2",
          returning ? "mt-5" : "mt-7"
        )}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {campusCards.map((card) => {
          const isCurrent = card.campus === campus;
          return (
            <motion.button
              key={card.campus}
              variants={fadeUp}
              type="button"
              disabled={!card.active}
              onClick={() => pickCampus(card.campus)}
              className={cn(
                "rounded-[var(--radius-md)] border p-5 text-left transition-[border-color,background-color,transform] duration-[var(--dur-fast)]",
                // Disabled = muted solid card + "Coming soon"; selected = accent border + check.
                // (Dashed read as broken, a tinted fill read the same as selected in light mode.)
                !card.active
                  ? "cursor-not-allowed border-fp-border-default bg-fp-bg-inset"
                  : isCurrent
                    ? "border-fp-border-accent bg-fp-bg-surface active:scale-[0.98]"
                    : "border-fp-border-default bg-fp-bg-surface hover:border-fp-border-accent active:scale-[0.98]"
              )}
              aria-current={isCurrent ? "true" : undefined}
            >
              <div
                className={cn(
                  "flex items-center gap-2 font-fp-display text-[length:var(--text-h)] font-bold",
                  card.active ? "text-fp-text-strong" : "text-fp-text-dim"
                )}
              >
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-[2px]", !card.active && "opacity-40")}
                  style={{ background: card.swatch }}
                />
                {CAMPUS_LABELS[card.campus]}
              </div>
              <div className="mt-1.5 text-[length:var(--text-small)] text-fp-text-dim">{card.detail}</div>
              <FPLabel tone={card.active ? "accent" : "dim"} className="mt-3.5 inline-flex items-center gap-1">
                {!card.active ? (
                  "Coming soon"
                ) : isCurrent && hasHydrated ? (
                  <>
                    <Check className="h-3 w-3" strokeWidth={2} /> Your campus
                  </>
                ) : (
                  <>
                    Ready <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </>
                )}
              </FPLabel>
            </motion.button>
          );
        })}
      </motion.div>

      {showTourPrompt ? (
        <p className="mt-7 text-[length:var(--text-small)] text-fp-text-dim">
          New here?{" "}
          <button
            type="button"
            onClick={tour.start}
            className="text-fp-text-body underline underline-offset-[3px] hover:text-fp-accent"
          >
            Take a 60-second tour →
          </button>{" "}
          <button
            type="button"
            onClick={() => setTourPromptDismissed(true)}
            className="text-fp-text-dim underline underline-offset-[3px] hover:text-fp-text-body"
          >
            Not now
          </button>
        </p>
      ) : null}
    </>
  );
}
