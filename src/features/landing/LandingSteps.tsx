"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { readableTextColor } from "@/components/fp-ui/slot-matrix-timetable";
import { BRAND_PALETTE } from "@/lib/coursePalette";

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

export function LandingSteps() {
  return (
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
  );
}
