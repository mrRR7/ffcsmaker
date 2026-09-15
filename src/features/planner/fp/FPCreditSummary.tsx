"use client";

import { useAppStore } from "@/store/useAppStore";
import { FPBadge } from "@/components/fp-ui/badge";

const VIT_CREDIT_CAP = 27;

/**
 * FPCreditSummary — reskin of `src/components/CreditCounter.tsx`. Same cap,
 * same over/near thresholds; rendered as a single mono FPBadge instead of a
 * progress bar.
 */
export function FPCreditSummary() {
  const courses = useAppStore((state) => state.courses);
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);
  const isOver = totalCredits > VIT_CREDIT_CAP;
  const isNear = totalCredits >= VIT_CREDIT_CAP - 3;
  const tone = isOver ? "danger" : isNear ? "warn" : "neutral";

  return (
    <FPBadge tone={tone}>
      {totalCredits} / {VIT_CREDIT_CAP} CR{isOver ? " · OVER" : ""}
    </FPBadge>
  );
}
