"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarPlus, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { ScoredTimetable, TimeSlot } from "@/engine/types";
import { exportTimetableIcal } from "@/lib/export/exportIcal";
import { DBSemester } from "@/types/db";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fourMonthsFromTodayIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 4);
  return date.toISOString().slice(0, 10);
}

export function IcalExportDialog({
  schedule,
  slots
}: {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(fourMonthsFromTodayIso());
  const timetableName = useMemo(
    () => `${schedule.rankingMode} FFCS Timetable`,
    [schedule.rankingMode]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    async function loadActiveSemester() {
      try {
        const response = await fetch("/api/catalog/semesters?active=1");
        const json = (await response.json()) as { semesters?: DBSemester[] };
        const semester = json.semesters?.[0];
        if (!cancelled && semester) {
          setStartDate(semester.start_date ?? todayIso());
          setEndDate(semester.end_date ?? fourMonthsFromTodayIso());
        }
      } catch {
        // Defaults are enough when the catalog is not configured.
      }
    }

    loadActiveSemester();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function download() {
    exportTimetableIcal(schedule, slots, startDate, endDate, timetableName);
    toast.success("Calendar file downloaded.");
    setIsOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        <CalendarPlus className="h-4 w-4" />
        Calendar
      </Button>
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="ical-export-title"
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle id="ical-export-title">Add to Calendar</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="semester-start-date">Semester start date</Label>
                <Input
                  id="semester-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester-end-date">Semester end date</Label>
                <Input
                  id="semester-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
              <Button type="button" className="w-full" onClick={download}>
                <Download className="h-4 w-4" />
                Download .ics file
              </Button>
              <p className="text-sm text-muted-foreground">
                Open the downloaded file to import it into Google Calendar, Apple
                Calendar, or Outlook.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
