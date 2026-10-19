"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fpButtonVariants } from "@/components/fp-ui/button";
import { usePickCampus } from "@/features/landing/usePickCampus";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";

// A real link (crawlable /planner href) that also selects the campus on click.
export function OpenPlannerLink({ campus }: { campus: Campus }) {
  const pickCampus = usePickCampus();
  return (
    <Link
      href="/planner"
      className={fpButtonVariants({ variant: "primary" })}
      onClick={(event) => {
        event.preventDefault();
        pickCampus(campus);
      }}
    >
      Plan my {CAMPUS_LABELS[campus]} timetable
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
    </Link>
  );
}
