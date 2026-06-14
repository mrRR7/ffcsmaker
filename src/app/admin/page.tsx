"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ClipboardList, Database, FileDown, FileUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { getSlotCatalog } from "@/engine/slotCatalog";
import { CAMPUS_LABELS, CAMPUS_SLOT_VARIANT, Campus } from "@/engine/types";
import { ImportRow, ParsedImportRow } from "@/features/import/importTypes";
import { parseCsvFile } from "@/features/import/importCsv";
import { parseXlsxFile } from "@/features/import/importXlsx";
import { validateAndParseRow } from "@/features/import/validateImport";
import { parsePastedText } from "@/features/paste-import/parsePastedText";
import { cn } from "@/utils/cn";

type InputMode = "file" | "paste";

function pastedOptionToImportRow(option: ReturnType<typeof parsePastedText>[number]): ImportRow {
  return {
    courseCode: option.courseCode ?? "",
    courseName: option.courseName ?? option.courseCode ?? "",
    professorName: option.professorName ?? "",
    theorySlots: option.theorySlotRaw ?? "",
    labSlots: option.labSlotRaw ?? "",
    credits: option.credits ? String(option.credits) : "3",
    notes: option.confidence === "low" ? option.errors.join("; ") : ""
  };
}

function validateRows(rows: ImportRow[], campus: Campus) {
  return rows.map((row) =>
    validateAndParseRow(row, getSlotCatalog(CAMPUS_SLOT_VARIANT[campus]))
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("file");
  const [campus, setCampus] = useState<Campus>("chennai");
  const [semesterLabel, setSemesterLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [ffcsOpens, setFfcsOpens] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const courseCount = new Set(
      rows
        .map((row) => row.courseCode.trim().toUpperCase())
        .filter(Boolean)
    ).size;
    const errorCount = rows.filter((row) => !row.isValid).length;
    return { courseCount, errorCount };
  }, [rows]);
  const slotVariant = CAMPUS_SLOT_VARIANT[campus];

  async function signOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  function downloadTemplate() {
    const csv = [
      "course_code,course_name,credits,course_type,professor_name,theory_slots,lab_slots,notes",
      "CS301,Data Structures and Algorithms,4,both,Dr. Sharma,\"A1,A2\",\"L1,L2\",Known for detailed notes"
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ffcs-course-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const parsed =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls")
          ? await parseXlsxFile(file)
          : await parseCsvFile(file);
      const nextRows = validateRows(parsed, campus);
      setRows(nextRows);
      toast.success(`${nextRows.length} rows parsed from file.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse file.");
    }
  }

  function parsePaste() {
    const pastedRows = parsePastedText(pasteText).map(pastedOptionToImportRow);
    const nextRows = validateRows(pastedRows, campus);
    setRows(nextRows);
    toast.success(`${nextRows.length} rows parsed from pasted text.`);
  }

  async function uploadToDatabase() {
    setError("");
    setStatus("");

    if (!semesterLabel.trim()) {
      setError("Semester label is required.");
      return;
    }

    if (rows.length === 0) {
      setError("Add file or pasted rows before uploading.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/admin/courses/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semesterLabel,
        campus,
        isActive,
        ffcsOpens: ffcsOpens ? new Date(ffcsOpens).toISOString() : null,
        startDate: startDate || null,
        endDate: endDate || null,
        rows
      })
    });
    setIsSubmitting(false);

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Upload failed.");
      return;
    }

    const message = `Imported: ${result.coursesCreated} courses, ${result.optionsCreated} options. ${result.rowsSkipped} rows skipped.`;
    setStatus(message);
    toast.success(message);
  }

  return (
    <div className="space-y-5 pb-16">
      <div className="rounded-lg border border-border bg-card/80 p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              FFCS Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Course Upload</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seed or replace the searchable course catalog for one semester.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester</CardTitle>
          <CardDescription>
            The active semester is what students see by default in catalog search.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="semester-campus">Campus</Label>
            <Select
              id="semester-campus"
              value={campus}
              onChange={(event) => {
                setCampus(event.target.value as Campus);
                setRows([]);
              }}
            >
              {(Object.keys(CAMPUS_LABELS) as Campus[]).map((option) => (
                <option key={option} value={option}>
                  {CAMPUS_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot-variant">Slot variant</Label>
            <Input id="slot-variant" value={slotVariant} readOnly />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="semester-label">Label</Label>
            <Input
              id="semester-label"
              placeholder="2026 Fall Semester"
              value={semesterLabel}
              onChange={(event) => setSemesterLabel(event.target.value)}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-background/30 px-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Set as active semester
          </label>
          <div className="space-y-2">
            <Label htmlFor="ffcs-opens">FFCS opens</Label>
            <Input
              id="ffcs-opens"
              type="datetime-local"
              value={ffcsOpens}
              onChange={(event) => setFfcsOpens(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-start">Semester start</Label>
            <Input
              id="semester-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-end">Semester end</Label>
            <Input
              id="semester-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Course data</CardTitle>
            <CardDescription>
              Upload CSV/XLSX rows or paste forwarded text and review before import.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "file" ? "default" : "outline"}
              onClick={() => setMode("file")}
            >
              <FileUp className="h-4 w-4" />
              Upload CSV/XLSX
            </Button>
            <Button
              type="button"
              variant={mode === "paste" ? "default" : "outline"}
              onClick={() => setMode("paste")}
            >
              <ClipboardList className="h-4 w-4" />
              Paste text
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "file" ? (
            <div className="rounded-lg border border-dashed border-border bg-background/30 p-6">
              <Label htmlFor="course-file">Course data file</Label>
              <Input
                id="course-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="mt-2"
                onChange={handleFileChange}
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Expected columns: course_code, course_name, credits, course_type,
                professor_name, theory_slots, lab_slots, notes.
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={downloadTemplate}>
                <FileDown className="h-4 w-4" />
                Download template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="CS301 - Dr. Sharma - A1+A2 / L1+L2"
                className="min-h-48"
              />
              <Button type="button" onClick={parsePaste} disabled={!pasteText.trim()}>
                <ClipboardList className="h-4 w-4" />
                Parse pasted text
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {rows.length} rows, {summary.courseCount} unique courses,{" "}
            {summary.errorCount} errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
              Parsed rows will appear here.
            </div>
          ) : (
            <div className="max-h-96 overflow-auto rounded-md border border-border">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3">Course</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Professor</th>
                    <th className="p-3">Theory</th>
                    <th className="p-3">Lab</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border/60",
                        !row.isValid && "bg-amber-500/10"
                      )}
                    >
                      <td className="p-3 font-semibold">{row.courseCode}</td>
                      <td className="p-3">{row.courseName}</td>
                      <td className="p-3">{row.professorName}</td>
                      <td className="p-3">{row.theorySlots || "None"}</td>
                      <td className="p-3">{row.labSlots || "None"}</td>
                      <td className="p-3">{row.credits}</td>
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="text-primary">Ready</span>
                        ) : (
                          <span className="text-amber-400">
                            {row.errors.join("; ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {status ? <p className="text-sm text-primary">{status}</p> : null}

          <Button
            type="button"
            disabled={isSubmitting || rows.length === 0}
            onClick={uploadToDatabase}
          >
            <Database className="h-4 w-4" />
            {isSubmitting ? "Uploading..." : "Upload to database"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
