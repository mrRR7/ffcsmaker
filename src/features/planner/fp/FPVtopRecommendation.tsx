"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Campus } from "@/engine/types";
import { VtopImportModal } from "@/features/vtop-scraper/components/VtopImportModal";
import { getSupportedCampusKeys } from "@/features/vtop-scraper/types";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";

const DISMISS_KEY = "dismissed_vtop_scraper_recommendation";

/**
 * FPVtopRecommendation — reskin of `src/features/planner/VtopScraperRecommendation.tsx`.
 * Same dismissal/localStorage/supported-campus logic; the VTOP import wizard
 * itself (`VtopImportModal`) is reused unmodified since it has no fp-ui
 * equivalent and is a self-contained overlay.
 */
export function FPVtopRecommendation({
  campus,
  hasImportedData
}: {
  campus: Campus | null;
  hasImportedData: boolean;
}) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const supported = campus ? getSupportedCampusKeys().includes(campus) : false;

  if (!campus || hasImportedData || isDismissed || !supported) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  }

  return (
    <>
      <div
        className="flex flex-col gap-3 border-b border-l-2 border-b-fp-border-default border-l-fp-accent px-6 py-4 sm:flex-row sm:items-center"
        style={{ backgroundColor: "var(--accent-wash)" }}
      >
        <div className="min-w-0 flex-1">
          <FPLabel tone="accent">Need your exact FFCS data</FPLabel>
          <p className="mt-1 text-[13px] leading-[1.5] text-fp-text-body">
            Can&apos;t find your course or faculty in the catalog. Import your actual VTOP registration data
            with a one-click bookmark &mdash; no install required.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FPButton variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Download className="h-3.5 w-3.5" />
            Import from VTOP
          </FPButton>
          <FPButton variant="ghost" size="sm" onClick={dismiss}>
            Dismiss
          </FPButton>
        </div>
      </div>
      <VtopImportModal open={modalOpen} onClose={() => setModalOpen(false)} campus={campus} />
    </>
  );
}
