"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ClipboardList, Database, FileDown, FileUp, LogOut } from "lucide-react";
import { getSlotCatalog } from "@/engine/slotCatalog";
import { CAMPUS_LABELS, CAMPUS_SLOT_VARIANT, Campus } from "@/engine/types";
import { ImportRow, ParsedImportRow } from "@/features/import/importTypes";
import { parseCsvFile } from "@/features/import/importCsv";
import { parseXlsxFile } from "@/features/import/importXlsx";
import { validateAndParseRow } from "@/features/import/validateImport";
import { parsePastedText } from "@/features/paste-import/parsePastedText";
import { cn } from "@/utils/cn";
import { FPPanel } from "@/components/fp-ui/panel";
import { FPLabel } from "@/components/fp-ui/label";
import { FPButton } from "@/components/fp-ui/button";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPNote } from "@/components/fp-ui/note";
import { FPCheckbox } from "@/components/fp-ui/checkbox";
import { FPSlotTable, FPSlotTableColumn } from "@/components/fp-ui/slot-table";

type InputMode = "file" | "paste";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset px-3 py-2 text-[var(--text-small)] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none disabled:opacity-60";

const fileInputClass =
  "mt-2 block w-full text-[var(--text-small)] text-fp-text-dim file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-fp-accent file:px-3 file:py-[7px] file:font-fp-mono file:text-[var(--text-micro)] file:font-medium file:uppercase file:tracking-[0.14em] file:text-fp-text-on-accent";

const previewColumns: FPSlotTableColumn<ParsedImportRow>[] = [
  { key: "course", header: "Course", render: (row) => row.courseCode },
  { key: "name", header: "Name", render: (row) => row.courseName },
  { key: "professor", header: "Professor", render: (row) => row.professorName },
  { key: "program", header: "Program", render: (row) => row.program || undefined },
  { key: "theory", header: "Theory", render: (row) => row.theorySlots || undefined },
  { key: "lab", header: "Lab", render: (row) => row.labSlots || undefined },
  { key: "credits", header: "Credits", render: (row) => row.credits },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.isValid ? (
        <FPBadge tone="accent">Ready</FPBadge>
      ) : (
        <FPBadge tone="danger">{row.errors.join("; ")}</FPBadge>
      )
  }
];

function pastedOptionToImportRow(option: ReturnType<typeof parsePastedText>[number]): ImportRow {
  return {
    courseCode: option.courseCode ?? "",
    courseName: option.courseName ?? option.courseCode ?? "",
    professorName: option.professorName ?? "",
    program: "",
    theorySlots: option.theorySlotRaw ?? "",
    labSlots: option.labSlotRaw ?? "",
    credits: option.credits ? String(option.credits) : "3",
    notes: option.confidence === "low" ? option.errors.join("; ") : ""
  };
}

function validateRows(rows: ImportRow[], campus: Campus) {
  return rows.map((row) => validateAndParseRow(row, getSlotCatalog(CAMPUS_SLOT_VARIANT[campus])));
}

export function AdminDashboard() {
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
      rows.map((row) => row.courseCode.trim().toUpperCase()).filter(Boolean)
    ).size;
    const errorCount = rows.filter((row) => !row.isValid).length;
    return { courseCount, errorCount };
  }, [rows]);
  const slotVariant = CAMPUS_SLOT_VARIANT[campus];

  async function signOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/new/admin/login");
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
        file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")
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
      toast.error(result?.error ?? "Upload failed.");
      return;
    }

    const message = `Imported: ${result.coursesCreated} courses, ${result.optionsCreated} options. ${result.rowsSkipped} rows skipped.`;
    setStatus(message);
    toast.success(message);
  }

  return (
    <div className="space-y-5 pb-16">
      <FPPanel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FPLabel tone="accent" variant="eyebrow">FFCS admin</FPLabel>
            <h1 className="mt-2 font-fp-display text-[var(--text-title)] font-bold text-fp-text-strong">Course upload</h1>
            <p className="mt-1 text-[var(--text-small)] text-fp-text-dim">
              Seed or replace the searchable course catalog for one semester.
            </p>
          </div>
          <FPButton type="button" variant="secondary" size="sm" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </FPButton>
        </div>
      </FPPanel>

      <FPPanel title="Semester">
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <FPLabel>Campus</FPLabel>
            <select
              value={campus}
              onChange={(event) => {
                setCampus(event.target.value as Campus);
                setRows([]);
              }}
              className={fieldClass}
            >
              {(Object.keys(CAMPUS_LABELS) as Campus[]).map((option) => (
                <option key={option} value={option}>
                  {CAMPUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <FPLabel>Slot variant</FPLabel>
            <input value={slotVariant} readOnly className={cn(fieldClass, "text-fp-text-dim")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <FPLabel>Label</FPLabel>
            <input
              placeholder="2026 Fall Semester"
              value={semesterLabel}
              onChange={(event) => setSemesterLabel(event.target.value)}
              className={fieldClass}
            />
          </div>
          <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset px-3 py-[9px]">
            <FPCheckbox checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-[var(--text-small)] text-fp-text-body">Set as active semester</span>
          </label>
          <div className="space-y-2">
            <FPLabel>FFCS opens</FPLabel>
            <input
              type="datetime-local"
              value={ffcsOpens}
              onChange={(event) => setFfcsOpens(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <FPLabel>Semester start</FPLabel>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <FPLabel>Semester end</FPLabel>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </FPPanel>

      <FPPanel
        title="Course data"
        action={
          <>
            <FPButton
              type="button"
              variant={mode === "file" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setMode("file")}
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload CSV/XLSX
            </FPButton>
            <FPButton
              type="button"
              variant={mode === "paste" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setMode("paste")}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Paste text
            </FPButton>
          </>
        }
      >
        <div className="space-y-4 p-4">
          {mode === "file" ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-fp-border-default bg-fp-bg-inset p-6">
              <FPLabel>Course data file</FPLabel>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className={fileInputClass}
              />
              <FPNote className="mt-3">
                Expected columns: course_code, course_name, credits, course_type, professor_name,
                theory_slots, lab_slots, notes.
              </FPNote>
              <FPButton type="button" variant="secondary" size="sm" className="mt-4" onClick={downloadTemplate}>
                <FileDown className="h-3.5 w-3.5" />
                Download template
              </FPButton>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="CS301 - Dr. Sharma - A1+A2 / L1+L2"
                className={cn(fieldClass, "min-h-48")}
              />
              <FPButton type="button" size="sm" onClick={parsePaste} disabled={!pasteText.trim()}>
                <ClipboardList className="h-3.5 w-3.5" />
                Parse pasted text
              </FPButton>
            </div>
          )}
        </div>
      </FPPanel>

      <FPPanel title="Preview">
        <div className="space-y-4 p-4">
          <p className="text-[var(--text-small)] text-fp-text-dim">
            {rows.length} rows, {summary.courseCount} unique courses, {summary.errorCount} errors
          </p>

          {rows.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[var(--text-small)] text-fp-text-dim">
              Parsed rows will appear here.
            </div>
          ) : (
            <div className="max-h-96 overflow-auto">
              <FPSlotTable columns={previewColumns} rows={rows} rowKey={(row) => row.id} />
            </div>
          )}

          {error ? <p className="text-[var(--text-small)] text-fp-danger">{error}</p> : null}
          {status ? <p className="text-[var(--text-small)] text-fp-accent">{status}</p> : null}

          <FPButton type="button" disabled={isSubmitting || rows.length === 0} onClick={uploadToDatabase}>
            <Database className="h-3.5 w-3.5" />
            {isSubmitting ? "Uploading" : "Upload to database"}
          </FPButton>
        </div>
      </FPPanel>
    </div>
  );
}
