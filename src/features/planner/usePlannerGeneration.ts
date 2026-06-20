import { useAppStore } from "@/store/useAppStore";
import { useGenerator } from "@/hooks/useGenerator";
import toast from "react-hot-toast";

export function usePlannerGeneration() {
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );

  const { generate, cancel, isGenerating, progress, checked, accepted } =
    useGenerator();

  function runGeneration() {
    const slotIds = new Set(slots.map((slot) => slot.id));
    const invalidCourses = courses.filter((course) =>
      course.options.some((option) =>
        [...option.theorySlotIds, ...option.labSlotIds].some(
          (slotId) => !slotIds.has(slotId)
        )
      )
    );

    if (invalidCourses.length > 0) {
      toast.error(
        `${invalidCourses.length} course(s) have invalid slots for this campus. Re-add them from the catalog.`
      );
      return;
    }

    generate({
      courses,
      slots,
      constraints,
      rankingMode,
      usePriorityRanking,
      maxResults: 500,
    });
  }

  return {
    runGeneration,
    cancel,
    isGenerating,
    progress,
    checked,
    accepted,
  };
}
