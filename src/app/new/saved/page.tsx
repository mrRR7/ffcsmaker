"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { useAppStore } from "@/store/useAppStore";
import { exportScheduleJson } from "@/utils/export";
import { createSharedTimetableUrl } from "@/utils/share";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPCard } from "@/components/fp-ui/card";
import { SavedWeekCard } from "./SavedWeekCard";

export default function NewSavedPage() {
  const router = useRouter();
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const savedSchedules = useAppStore((state) => state.savedSchedules);
  const deleteSavedSchedule = useAppStore((state) => state.deleteSavedSchedule);
  const renameSavedSchedule = useAppStore((state) => state.renameSavedSchedule);
  const toggleFavoriteSchedule = useAppStore((state) => state.toggleFavoriteSchedule);
  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);

  const sorted = useMemo(
    () =>
      [...savedSchedules].sort(
        (a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt)
      ),
    [savedSchedules]
  );

  function reopen(scheduleId: string) {
    const saved = savedSchedules.find((item) => item.id === scheduleId);
    if (!saved) return;
    setGeneratedSchedules([saved.timetable]);
    toast.success("Schedule reopened in results.");
    router.push("/new/results");
  }

  function rerun() {
    toast("Add your latest courses on the planner, then re-generate to check this week still holds.");
    router.push("/new/planner");
  }

  function compareTopThree() {
    if (sorted.length === 0) {
      toast.error("Nothing saved yet.");
      return;
    }
    sorted.slice(0, 3).forEach((saved) => addCompareSchedule(saved.timetable.id));
    router.push("/new/compare");
  }

  function exportAll() {
    if (sorted.length === 0) {
      toast.error("Nothing saved yet.");
      return;
    }
    sorted.forEach((saved) => exportScheduleJson(saved.timetable));
    toast.success(`Exported ${sorted.length} week${sorted.length === 1 ? "" : "s"}.`);
  }

  const [isSharing, setIsSharing] = useState(false);

  async function createShareLink() {
    const featured = sorted[0];
    if (!featured) {
      toast.error("Nothing saved yet.");
      return;
    }
    setIsSharing(true);
    try {
      const url = await createSharedTimetableUrl({
        schedule: featured.timetable,
        slots,
        courses,
        metrics: featured.timetable.metrics,
        score: featured.timetable.score,
        generatedAt: new Date().toISOString()
      });
      await navigator.clipboard.writeText(url);
      toast.success("Shared timetable URL copied.");
    } catch {
      toast.error("Failed to create a share link.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <section className="flex flex-wrap items-end gap-5 border-b border-fp-border-default px-6 py-8">
        <div>
          <h1 className="font-fp-display text-[length:var(--text-display)] font-bold tracking-[-0.01em] text-fp-text-strong">My weeks</h1>
          <p className="mt-1.5 max-w-xl text-[length:var(--text-body-size)] text-fp-text-body">
            Your registration-day shortlist. Order them now &mdash; on the day you&apos;ll be typing slot codes, not
            deciding.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <FPButton variant="secondary" size="sm" onClick={compareTopThree}>
            Compare top 3
          </FPButton>
          <FPButton variant="secondary" size="sm" onClick={exportAll}>
            Export all
          </FPButton>
        </div>
      </section>

      {sorted.length === 0 ? (
        <div className="px-6 py-10">
          <FPCard className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">No saved weeks yet</p>
            <p className="max-w-sm text-[length:var(--text-small)] text-fp-text-dim">Save schedules from Results to see them here.</p>
            <Link href="/new/planner" className="mt-2 inline-block">
              <FPButton variant="primary" size="sm">
                Open planner
              </FPButton>
            </Link>
          </FPCard>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-4 px-6 py-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {sorted.map((saved) => {
            const staleCourse = courses.find(
              (course) => !saved.timetable.selections.some((selection) => selection.courseId === course.id)
            );
            let unverifiedCourseCode: string | null = null;
            for (const selection of saved.timetable.selections) {
              const course = courses.find((item) => item.id === selection.courseId);
              const option = course?.options.find((item) => item.id === selection.optionId);
              if (!option || option.professorRating === undefined) {
                unverifiedCourseCode = selection.courseCode;
                break;
              }
            }

            return (
              <motion.div key={saved.id} variants={fadeUp}>
                <SavedWeekCard
                  saved={saved}
                  slots={slots}
                  courses={courses}
                  isStale={Boolean(staleCourse)}
                  staleCourseCode={staleCourse?.courseCode ?? null}
                  unverifiedCourseCode={unverifiedCourseCode}
                  onToggleFavorite={() => toggleFavoriteSchedule(saved.id)}
                  onRename={(name) => renameSavedSchedule(saved.id, name)}
                  onDelete={() => deleteSavedSchedule(saved.id)}
                  onReopen={() => reopen(saved.id)}
                  onRerun={rerun}
                />
              </motion.div>
            );
          })}

          <div className="mt-2 flex items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-fp-border-strong p-[18px]">
            <div>
              <FPLabel>Registration day</FPLabel>
              <p className="mt-1 text-[length:var(--text-small)] text-fp-text-dim">
                Weeks live in this browser only &mdash; clearing site data clears them. Share a link if you want one
                on your phone too.
              </p>
            </div>
            <button
              type="button"
              onClick={createShareLink}
              disabled={isSharing}
              aria-busy={isSharing}
              className="fp-label ml-auto inline-flex shrink-0 items-center gap-1 text-[length:var(--text-micro)] text-fp-accent hover:text-fp-accent-bright disabled:cursor-not-allowed disabled:text-fp-text-dim"
            >
              Create share link
              {isSharing ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
              ) : (
                <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
