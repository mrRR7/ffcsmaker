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
import { useTour } from "@/features/tour/useTour";
import { hasSeenTour } from "@/features/tour/tourStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const campusCards: Array<{ campus: Campus; active: boolean; detail: string }> = [
  { campus: "chennai", active: true, detail: "Mon–Fri slot catalog" },
  { campus: "vellore", active: true, detail: "Mon–Fri slot catalog" },
  { campus: "bhopal", active: true, detail: "Bhopal slot catalog" },
  { campus: "ap", active: false, detail: "AP slot catalog in progress" }
];

const steps = [
  {
    label: "01 Add courses",
    body: "Search the catalog for your program, paste a list, or import a CSV/XLSX."
  },
  {
    label: "02 Say what you'd avoid",
    body: "Optional. No 8am starts, one free weekday, a professor you'd rather not have."
  },
  {
    label: "03 Pick a week",
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
    router.push("/new/planner");
  }

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <section className="flex flex-col items-center border-b border-fp-border-default px-8 pb-14 pt-16 text-center">
        <h1 className="max-w-3xl font-fp-display text-[44px] font-bold leading-[1.08] tracking-[-0.015em] text-fp-text-strong">
          Your timetable, built for you in about a minute.
        </h1>
        <p className="mt-4 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
          Free, no login, nothing sent to VTOP. Every conflict-free combination of your courses, ranked. First
          &mdash; which campus?
        </p>

        <motion.div
          data-tour-id="home-cta"
          className="mt-9 grid w-full max-w-4xl grid-cols-2 gap-4 text-left sm:grid-cols-4"
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
                  "rounded-[var(--radius-md)] border p-5 transition-[border-color,background-color,transform] duration-[var(--dur-fast)]",
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
                    "font-fp-display text-[length:var(--text-h)] font-bold",
                    card.active ? "text-fp-text-strong" : "text-fp-text-dim"
                  )}
                >
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

        <p className="mt-7 text-[length:var(--text-small)] text-fp-text-dim">
          Never done FFCS before? <span className="cursor-pointer text-fp-text-body underline underline-offset-[3px] hover:text-fp-accent">40-second explainer</span>
        </p>

        {showTourPrompt ? (
          <p className="mt-2 text-[length:var(--text-small)] text-fp-text-dim">
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
      </section>

      <section className="mx-auto max-w-4xl px-8 pb-14 pt-12">
        <motion.div
          className="grid grid-cols-1 gap-8 sm:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-40px" }}
        >
          {steps.map((step) => (
            <motion.div key={step.label} variants={fadeUp} className="border-l-2 border-fp-accent pl-4">
              <FPLabel tone="accent">{step.label}</FPLabel>
              <p className="mt-2.5 text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">{step.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
