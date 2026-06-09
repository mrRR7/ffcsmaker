"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ScoredTimetable, TimeSlot, Course } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { Download, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface Snapshot {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  metrics: ScoredTimetable["metrics"];
  score: number;
  generatedAt: string;
  appVersion?: string;
}

export function SharedTimetableView({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const importState = useAppStore(state => state.importState); // Ensure importState exists or implement it

  const handleImport = () => {
    // We only have the subset of courses and slots needed for this timetable
    // However, importing it means we override the planner state. 
    // To make it editable, the user needs the full constraints and slots. 
    // If we only have snapshot.slots and snapshot.courses, we can set those, but constraints might be default.
    // For now, we'll try to set what we have.
    useAppStore.setState((state) => ({
      slots: snapshot.slots,
      courses: snapshot.courses,
      activeScheduleId: snapshot.schedule.id,
      // We don't have constraints in the snapshot. We could use default constraints.
    }));
    toast.success("Imported to planner!");
    router.push("/planner");
  };

  const totalCredits = snapshot.schedule.selections.reduce(
    (sum, selection) => sum + selection.credits,
    0
  );

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Shared Timetable</h1>
            <Badge variant="secondary">Snapshot</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date(snapshot.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={handleImport}>
          <Download className="mr-2 h-4 w-4" />
          Import Into Planner
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Score {snapshot.score}
              </CardTitle>
            </div>
            <Badge className="border-primary/25 bg-primary/10 text-primary">
              {snapshot.schedule.rankingMode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Metric label="Credits" value={totalCredits} />
            <Metric label="Half days" value={snapshot.metrics.halfDays} />
            <Metric label="Gap slots" value={snapshot.metrics.totalGapSlots} />
            <Metric label="Ends" value={snapshot.metrics.latestEndTime} />
          </div>
          <div className="mt-6">
            <TimetableGrid
              schedule={snapshot.schedule}
              slots={snapshot.slots}
              courses={snapshot.courses}
              compact={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
