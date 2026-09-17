"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, Download, UploadCloud } from "lucide-react";
import { parseCsvFile } from "@/features/import/importCsv";
import { parseXlsxFile } from "@/features/import/importXlsx";
import { ImportRow, ParsedImportRow } from "@/features/import/importTypes";
import { validateAndParseRow } from "@/features/import/validateImport";
import { transformToCourses } from "@/features/import/transformImport";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPNote } from "@/components/fp-ui/note";
import { FPStepNav } from "@/components/fp-ui/step-nav";
import { FPSlotTable } from "@/components/fp-ui/slot-table";

type WizardStep = "upload" | "detect" | "review" | "confirm";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "detect", label: "Detect" },
  { id: "review", label: "Review" },
  { id: "confirm", label: "Confirm" }
];

function inputClass(extra?: string) {
  return cn(
    "w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2 py-1.5 text-[12px] text-fp-text-body focus:border-fp-border-accent focus:outline-none",
    extra
  );
}

/**
 * FPImportTab — reskin of `src/features/import/ImportManager.tsx` and its
 * dropzone/preview/validation/confirm subcomponents. Same 4-stage flow and
 * store writes (`transformToCourses`, `setConstraint("professorLocks", ...)`),
 * rebuilt as numbered fp-ui stages (no pixel mockup existed for this tab).
 */
export function FPImportTab() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const setCourses = useAppStore((state) => state.setCourses);
  const setConstraint = useAppStore((state) => state.setConstraint);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function handleParsed(rows: ImportRow[]) {
    if (rows.length === 0) {
      toast.error("File is empty or could not be read.");
      return;
    }
    const validated = rows.map((row) => validateAndParseRow(row, slots));
    setParsedRows(validated);
    const invalidCount = validated.filter((r) => !r.isValid).length;
    setStep(invalidCount === 0 ? "review" : "detect");
  }

  function handleUpdateRow(id: string, updates: Partial<ParsedImportRow>) {
    setParsedRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }

  function handleCancel() {
    setParsedRows([]);
    setStep("upload");
  }

  function handleImport() {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      handleCancel();
      return;
    }
    try {
      const { updatedCourses, locks } = transformToCourses(validRows, courses, slots, null);
      setCourses(updatedCourses);
      if (locks.length > 0) {
        setConstraint("professorLocks", Array.from(new Set([...constraints.professorLocks, ...locks])));
      }
      toast.success(`Imported ${validRows.length} options successfully.`);
      handleCancel();
    } catch {
      toast.error("Failed to merge imported data.");
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      let rows: ImportRow[] = [];
      if (file.name.endsWith(".csv")) {
        rows = await parseCsvFile(file);
      } else if (file.name.endsWith(".xlsx")) {
        rows = await parseXlsxFile(file);
      } else {
        toast.error("Unsupported file type.");
        setIsProcessing(false);
        return;
      }
      handleParsed(rows);
    } catch {
      toast.error("Failed to parse file.");
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    },
    maxFiles: 1
  });

  function downloadTemplate() {
    const csvContent =
      "data:text/csv;charset=utf-8,courseCode,courseName,professorName,theorySlots,labSlots,credits,locked,notes\nCSE1001,Problem Solving,John Doe,\"A1, TA1\",\"L1, L2\",3,false,Great professor";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ultimate-ffcs-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const groupedCourses = useMemo(() => {
    const groups: Record<string, { name: string; rows: ParsedImportRow[] }> = {};
    for (const row of validRows) {
      if (!groups[row.courseCode]) {
        groups[row.courseCode] = { name: row.courseName, rows: [] };
      }
      groups[row.courseCode].rows.push(row);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [validRows]);

  return (
    <div className="p-6">
      <FPStepNav
        className="mb-6 rounded-[var(--radius-md)] border border-fp-border-default"
        steps={STEPS.map((s, index) => ({
          number: String(index + 1).padStart(2, "0"),
          label: s.label,
          status: index === stepIndex ? "active" : index < stepIndex ? "done" : "upcoming"
        }))}
      />

      {step === "upload" ? (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-6 text-center transition-colors",
              isDragActive ? "border-fp-border-accent" : "border-fp-border-default hover:border-fp-border-strong"
            )}
            style={isDragActive ? { backgroundColor: "var(--accent-wash)" } : undefined}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mb-3 h-9 w-9 text-fp-text-dim" />
            <p className="text-[var(--text-small)] font-medium text-fp-text-body">
              {isDragActive ? "Drop the file here" : "Drag & drop a CSV or XLSX file here"}
            </p>
            <p className="mt-1 text-[12px] text-fp-text-dim">or click to select a file</p>
            {isProcessing ? <FPLabel tone="accent" className="mt-3">Processing</FPLabel> : null}
          </div>
          <FPButton variant="secondary" size="md" className="w-full justify-center" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Download template
          </FPButton>
        </div>
      ) : null}

      {step === "detect" ? (
        <div className="space-y-4">
          <FPNote tone="warn">
            {invalidRows.length} row{invalidRows.length === 1 ? "" : "s"} had missing or invalid data.
            {validRows.length > 0 ? ` You can proceed with the ${validRows.length} valid rows, or cancel and fix your file.` : ""}
          </FPNote>
          <div className="overflow-x-auto">
            <FPSlotTable
              columns={[
                { key: "code", header: "Code", render: (row: ParsedImportRow) => row.courseCode || "N/A" },
                { key: "prof", header: "Professor", render: (row: ParsedImportRow) => row.professorName || "N/A" },
                {
                  key: "errors",
                  header: "Errors",
                  render: (row: ParsedImportRow) => <span className="text-fp-warn">{row.errors.join(", ")}</span>
                }
              ]}
              rows={invalidRows}
              rowKey={(row) => row.id}
            />
          </div>
          <div className="flex items-center justify-between">
            <FPButton variant="ghost" size="md" onClick={handleCancel}>
              Cancel upload
            </FPButton>
            <FPButton variant="primary" size="md" onClick={() => setStep("review")} disabled={validRows.length === 0}>
              Discard invalid and proceed
            </FPButton>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset px-4 py-3">
            <BookOpen className="h-4 w-4 text-fp-accent" />
            <div>
              <div className="text-[var(--text-small)] font-medium text-fp-text-strong">Extracted courses</div>
              <FPLabel>
                {validRows.length} valid options across {groupedCourses.length} courses
              </FPLabel>
            </div>
          </div>

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {groupedCourses.map(([code, { name, rows }]) => {
              const isExpanded = Boolean(expanded[code]);
              return (
                <div key={code} className="overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [code]: !prev[code] }))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-fp-text-dim" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-fp-text-dim" />
                      )}
                      <span className="font-fp-mono text-[var(--text-small)] text-fp-text-strong">{code}</span>
                      <span className="hidden text-[var(--text-small)] text-fp-text-dim sm:inline">{name}</span>
                    </div>
                    <FPBadge>{rows.length} option{rows.length === 1 ? "" : "s"}</FPBadge>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2 border-t border-fp-border-default p-3">
                      {rows.map((row) => (
                        <div key={row.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                          <input
                            value={row.professorName}
                            onChange={(event) => handleUpdateRow(row.id, { professorName: event.target.value })}
                            className={inputClass()}
                          />
                          <input
                            value={row.theorySlots || ""}
                            placeholder="e.g. A1+TA1"
                            onChange={(event) => handleUpdateRow(row.id, { theorySlots: event.target.value })}
                            className={inputClass("font-fp-mono")}
                          />
                          <input
                            value={row.labSlots || ""}
                            placeholder="e.g. L1+L2"
                            onChange={(event) => handleUpdateRow(row.id, { labSlots: event.target.value })}
                            className={inputClass("font-fp-mono")}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-fp-border-default pt-4">
            <FPButton variant="ghost" size="md" onClick={handleCancel}>
              Cancel
            </FPButton>
            <FPButton variant="primary" size="md" onClick={() => setStep("confirm")}>
              Continue to confirmation
            </FPButton>
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-inset px-6 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-fp-accent" />
          <div>
            <h3 className="font-fp-display text-[17px] font-bold text-fp-text-strong">Ready to import</h3>
            <p className="mx-auto mt-2 max-w-sm text-[var(--text-small)] text-fp-text-dim">
              You are about to import {validRows.length} valid {validRows.length === 1 ? "row" : "rows"}. These will be
              merged with your existing planner courses and professor options.
            </p>
          </div>
          <div className="flex gap-3">
            <FPButton variant="secondary" size="md" onClick={handleCancel}>
              Cancel
            </FPButton>
            <FPButton variant="primary" size="md" onClick={handleImport}>
              Confirm and import
            </FPButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
