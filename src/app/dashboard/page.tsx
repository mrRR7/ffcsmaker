"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  GalleryVerticalEnd,
  Sparkles
} from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSchedules, useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const savedSchedulesRaw = useAppStore((state) => state.savedSchedules);
  const generatedSchedulesRaw = useAppStore((state) => state.generatedSchedules);
  const savedSchedules = Array.isArray(savedSchedulesRaw) ? savedSchedulesRaw : [];
  const generatedSchedules = Array.isArray(generatedSchedulesRaw) ? generatedSchedulesRaw : [];
  const allSchedules = useMemo(
    () => getAllSchedules({ generatedSchedules, savedSchedules }),
    [generatedSchedules, savedSchedules]
  );
  const activeSchedule = allSchedules[0] ?? null;
  const optionCount = courses.reduce((sum, course) => sum + course.options.length, 0);
  const averageScore =
    generatedSchedules.length > 0
      ? Math.round(
          generatedSchedules.reduce((sum, schedule) => sum + schedule.score, 0) /
            generatedSchedules.length
        )
      : 0;

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Your local planner state, saved schedules, and optimization snapshot."
        action={
          <Link
            href="/planner"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Plan Semester
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Courses"
          value={courses.length}
          detail={`${optionCount} professor paths`}
          icon={BookOpenCheck}
        />
        <StatCard
          label="Fixed Slots"
          value={slots.length}
          detail="FFCS timing catalog"
          icon={CalendarDays}
        />
        <StatCard
          label="Generated"
          value={generatedSchedules.length}
          detail={averageScore ? `Avg score ${averageScore}` : "Ready to run"}
          icon={BarChart3}
        />
        <StatCard
          label="Saved"
          value={savedSchedules.length}
          detail={`${savedSchedules.filter((item) => item.favorite).length} favorites`}
          icon={GalleryVerticalEnd}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <TimetableGrid schedule={activeSchedule} slots={slots} courses={courses} />

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <QuickLink href="/planner" label="Edit planner" />
              <QuickLink href="/results" label="Open results" />
              <QuickLink href="/compare" label="Compare schedules" />
              <QuickLink href="/settings" label="Settings" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Saves</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedSchedules.slice(0, 5).map((saved) => (
                <div
                  key={saved.id}
                  className="rounded-md border border-border bg-background/35 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{saved.name}</p>
                    {saved.favorite ? <Badge>Favorite</Badge> : null}
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(saved.updatedAt), {
                      addSuffix: true
                    })}
                  </p>
                </div>
              ))}
              {savedSchedules.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Saved schedules will appear here.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
    >
      {label}
    </Link>
  );
}
