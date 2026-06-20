"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DesktopPlannerLayout } from "@/features/planner/DesktopPlannerLayout";
import { MobilePlannerFlow } from "@/features/planner/MobilePlannerFlow";

export default function PlannerPage() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Render a loading skeleton while media query resolves on initial hydration
  if (isMobile === undefined) {
    return (
      <div className="animate-pulse space-y-4 pt-4">
        <div className="h-10 w-full rounded bg-surface-soft md:w-48" />
        <div className="h-[200px] w-full rounded bg-surface-soft" />
        <div className="h-[400px] w-full rounded bg-surface-soft" />
      </div>
    );
  }

  return isMobile ? <MobilePlannerFlow /> : <DesktopPlannerLayout />;
}
