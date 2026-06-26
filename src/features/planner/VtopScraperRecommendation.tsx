"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campus } from "@/engine/types";
import { cn } from "@/utils/cn";
import { VtopImportModal } from "@/features/vtop-scraper/components/VtopImportModal";
import { getSupportedCampusKeys } from "@/features/vtop-scraper/types";

const DISMISS_KEY = "dismissed_vtop_scraper_recommendation";

interface VtopScraperRecommendationProps {
  campus: Campus | null;
  hasImportedData: boolean;
  className?: string;
}

export function VtopScraperRecommendation({
  campus,
  hasImportedData,
  className,
}: VtopScraperRecommendationProps) {
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
      <section
        className={cn(
          "rounded-lg border border-emerald-500/25 bg-surface-card shadow-none overflow-hidden",
          className
        )}
      >
        <div className="flex gap-3 border-l-4 border-emerald-500/70 p-4 sm:items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-500">
            <Download className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Need your exact FFCS data?
              </h3>
              <p className="text-sm text-muted-foreground">
                Can&apos;t find your course or faculty in the catalog? Import your
                actual VTOP registration data with a one-click bookmark — no install
                required.
              </p>
            </div>
            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-300">
                Missing courses
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-300">
                Changed faculty
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-300">
                Exact options
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                Import from VTOP
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={dismiss}>
                Dismiss
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-soft hover:text-ink"
            aria-label="Dismiss VTOP import recommendation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </section>

      <VtopImportModal open={modalOpen} onClose={() => setModalOpen(false)} campus={campus} />
    </>
  );
}
