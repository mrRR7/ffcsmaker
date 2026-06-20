"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import {
  parsePastedText,
  PastedCourseOption
} from "@/features/paste-import/parsePastedText";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

function confidenceClass(confidence: PastedCourseOption["confidence"]) {
  if (confidence === "high") {
    return "border-primary/25 bg-primary/10 text-primary";
  }
  if (confidence === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

export function PasteImport() {
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<PastedCourseOption[]>([]);
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const program = useAppStore((state) => state.program);
  const setCourses = useAppStore((state) => state.setCourses);

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.courseCode &&
          row.professorName &&
          (row.theorySlotRaw || row.labSlotRaw) &&
          row.confidence !== "low"
      ),
    [rows]
  );

  function parseText() {
    const parsed = parsePastedText(rawText);
    setRows(parsed);
    toast.success(`${parsed.length} course options parsed from your text.`);
  }

  function addRows() {
    const result = mergeCourseOptions(
      courses,
      validRows.map((row) => ({
        courseCode: row.courseCode ?? "",
        courseName: row.courseName ?? row.courseCode ?? "",
        credits: row.credits ?? 3,
        professorName: row.professorName ?? "",
        program,
        theorySlotsRaw: row.theorySlotRaw ?? "",
        labSlotsRaw: row.labSlotRaw ?? ""
      })),
      slots
    );

    if (result.addedOptions === 0) {
      toast.error("No new valid options were added.");
      return;
    }

    setCourses(result.courses);
    toast.success(`${result.addedOptions} professor options added to planner.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste Text</CardTitle>
        <CardDescription>
          Paste WhatsApp forwards, copied Excel rows, or multiline course blocks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder={"CS301 - Dr. Sharma - A1+A2 / L1+L2\nCS301 - Dr. Kumar - B1+B2 / L3+L4"}
          className="min-h-48"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={parseText} disabled={!rawText.trim()}>
            <ClipboardList className="h-4 w-4" />
            Parse text
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addRows}
            disabled={validRows.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add parsed options
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
            Parsed course options will appear here.
          </div>
        ) : (
          <div className="overflow-auto rounded-md border border-border">
            <table className="min-w-[840px] w-full text-left text-sm">
              <thead className="bg-card">
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3">Course</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Professor</th>
                  <th className="p-3">Theory</th>
                  <th className="p-3">Lab</th>
                  <th className="p-3">Credits</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.rawLine}-${index}`}
                    className="border-b border-border/60"
                  >
                    <td className="p-3 font-semibold">{row.courseCode ?? "Unknown"}</td>
                    <td className="p-3">{row.courseName ?? "Unknown"}</td>
                    <td className="p-3">{row.professorName ?? "Unknown"}</td>
                    <td className="p-3">{row.theorySlotRaw ?? "None"}</td>
                    <td className="p-3">{row.labSlotRaw ?? "None"}</td>
                    <td className="p-3">{row.credits ?? 3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
