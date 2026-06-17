"use client";

import { CheckCircle2, Clock3, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CAMPUS_LABELS, Campus } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

const campusOptions: Array<{
  campus: Campus;
  active: boolean;
  detail: string;
}> = [
  { campus: "chennai", active: true, detail: "Standard FFCS slots" },
  { campus: "vellore", active: true, detail: "Standard FFCS slots" },
  { campus: "bhopal", active: false, detail: "Coming soon" },
  { campus: "ap", active: false, detail: "AP slot catalog" }
];

export function CampusSelector() {
  const setCampus = useAppStore((state) => state.setCampus);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <MapPin className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Ultimate FFCS Planner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Which campus are you from?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Choose once to load the right catalog, course data, and timetable slots.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
          {campusOptions.map((option) => {
            const Icon = option.active ? CheckCircle2 : Clock3;
            return (
              <Card
                key={option.campus}
                className={cn(
                  "relative overflow-hidden border-hairline bg-canvas shadow-none transition",
                  option.active
                    ? "cursor-pointer hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <button
                  type="button"
                  disabled={!option.active}
                  onClick={() => setCampus(option.campus)}
                  className="block min-h-36 w-full text-left disabled:cursor-not-allowed"
                >
                  <CardContent className="flex h-full min-h-36 flex-col justify-between p-4 sm:p-5">
                    {!option.active ? (
                      <span className="absolute right-3 top-3 rounded-full border border-hairline bg-surface-card px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        Soon
                      </span>
                    ) : null}
                    <Icon className="h-5 w-5 text-primary" />
                    <span>
                      <span className="block text-base font-semibold text-foreground sm:text-lg">
                        {CAMPUS_LABELS[option.campus]}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                        {option.detail}
                      </span>
                    </span>
                  </CardContent>
                </button>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
