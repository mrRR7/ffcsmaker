"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { useAppStore } from "@/store/useAppStore";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";
import { readableTextColor } from "@/components/fp-ui/slot-matrix-timetable";
import { HeroWeekGrid } from "@/features/landing/HeroWeekGrid";
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

const steps = [
  {
    number: "01",
    title: "Add courses",
    body: "Search the catalog for your program, paste a list, or import a CSV/XLSX."
  },
  {
    number: "02",
    title: "Say what you'd avoid",
    body: "Optional. No 8am starts, one free weekday, a professor you'd rather not have."
  },
  {
    number: "03",
    title: "Pick a week",
    body: "Every layout that works, best first. Export to calendar, or copy the slot list for VTOP."
  }
];

export default function NewLandingPage() {
  const router = useRouter();
  const campus = useAppStore((state) => state.campus);
  const setCampus = useAppStore((state) => state.setCampus);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const tour = useTour();
  const [tourPromptDismissed, setTourPromptDismissed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const showTourPrompt =
    hasHydrated && isMobile === false && !tour.active && !tourPromptDismissed && !hasSeenTour();

  function pickCampus(next: Campus) {
    setCampus(next);
    router.push("/planner");
  }

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <section className="border-b border-fp-border-default px-8 pb-14 pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="max-w-3xl font-fp-display text-[44px] font-bold leading-[1.08] tracking-[-0.015em] text-fp-text-strong">
              Your timetable, built for you in about a minute.
            </h1>
            <p className="mt-4 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
              Free, no login, nothing sent to VTOP. Every conflict-free combination of your courses, ranked. First
              &mdash; which campus?
            </p>

            <motion.div
              data-tour-id="home-cta"
              className="mt-9 grid w-full max-w-4xl grid-cols-2 gap-4 text-left sm:grid-cols-4 lg:grid-cols-2"
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
                      !card.active
                        ? "cursor-not-allowed border-fp-border-default bg-fp-bg-inset"
                        : isCurrent
                          ? "border-[var(--border-selected)] active:scale-[0.98]"
                          : "border-fp-border-default bg-fp-bg-surface hover:border-fp-border-accent active:scale-[0.98]"
                    )}
                    style={card.active && isCurrent ? { backgroundColor: "var(--surface-selected)" } : undefined}
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
                      {card.active ? (
                        <>
                          Ready <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                        </>
                      ) : (
                        "Not yet"
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
          </div>

          <HeroWeekGrid className="hidden lg:block" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-8 pb-14 pt-12">
        <motion.div
          className="grid grid-cols-1 gap-8 sm:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-40px" }}
        >
          {steps.map((step, index) => {
            const chipColor = BRAND_PALETTE[index % BRAND_PALETTE.length];
            return (
              <motion.div key={step.number} variants={fadeUp} className="border-l-2 border-fp-border-default pl-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="fp-code inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-[length:var(--text-micro)] font-bold"
                    style={{ background: chipColor, color: readableTextColor(chipColor) }}
                  >
                    {step.number}
                  </span>
                  <span className="fp-text text-[length:var(--text-small)] font-medium text-fp-text-strong">
                    {step.title}
                  </span>
                </div>
                <p className="mt-2.5 text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">{step.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
