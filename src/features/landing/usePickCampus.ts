"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";

// Choose a campus and open the planner. setCampus wipes the plan, so keep it
// for the same campus and ask before switching away from one with courses
// (the header switcher asks too).
export function usePickCampus() {
  const router = useRouter();
  const campus = useAppStore((state) => state.campus);
  const setCampus = useAppStore((state) => state.setCampus);
  const courseCount = useAppStore((state) => state.courses.length);

  return (next: Campus) => {
    if (next !== campus) {
      if (
        courseCount > 0 &&
        !window.confirm(
          `Switch to ${CAMPUS_LABELS[next]}? This clears your current course list and generated timetables. Saved timetables stay.`
        )
      ) {
        return;
      }
      setCampus(next);
    }
    router.push("/planner");
  };
}
