"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { ParsedImportRow } from "@/features/import/importTypes";
import { validateAndParseRow } from "@/features/import/validateImport";
import { parseImport } from "@/features/paste-import/parseImport";
import { PasteImportMetadata } from "@/features/paste-import/types";
import { useAppStore } from "@/store/useAppStore";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPSlotTable } from "@/components/fp-ui/slot-table";

const PLACEHOLDER = "CS301 - Dr. Sharma - A1+A2 / L1+L2\nCS301 - Dr. Kumar - B1+B2 / L3+L4";

/**
 * FPPasteTab — reskin of `src/features/paste-import/PasteImport.tsx`. Same
 * parse/merge logic; markup rebuilt with fp-ui primitives (FPSlotTable for
 * the parsed-rows preview).
 */
export function FPPasteTab() {
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [, setImportMetadata] = useState<PasteImportMetadata>({});
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const setCourses = useAppStore((state) => state.setCourses);

  const validRows = useMemo(() => rows.filter((row) => row.isValid), [rows]);

  function parseText() {
    try {
      const parsed = parseImport(rawText);
      const validated = parsed.rows.map((row) => validateAndParseRow(row, slots));
      setRows(validated);
      setImportMetadata(parsed.metadata);
      toast.success(`${validated.length} course options parsed from your input.`);
    } catch (error) {
      setRows([]);
      setImportMetadata({});
      toast.error(error instanceof Error ? error.message : "Could not parse pasted input.");
    }
  }

  function addRows() {
    const result = mergeCourseOptions(
      courses,
      validRows.map((row) => ({
        courseCode: row.courseCode,
        courseName: row.courseName || row.courseCode,
        credits: Number(row.credits) || 3,
        professorName: row.professorName,
        program: null,
        theorySlotsRaw: row.theorySlots,
        labSlotsRaw: row.labSlots,
        notes: row.notes ?? ""
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
    <div className="space-y-4 p-6">
      <div>
        <h3 className="font-fp-display text-[17px] font-bold text-fp-text-strong">Paste text</h3>
        <p className="mt-1 text-[13px] text-fp-text-dim">
          Paste WhatsApp forwards, copied Excel rows, or multiline course blocks.
        </p>
      </div>

      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-[14px] py-[11px] font-fp-mono text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <FPButton variant="primary" size="sm" onClick={parseText} disabled={!rawText.trim()}>
          Parse text
        </FPButton>
        <FPButton variant="secondary" size="sm" onClick={addRows} disabled={validRows.length === 0}>
          Add parsed options
        </FPButton>
        {rows.length > 0 ? (
          <FPLabel>
            {validRows.length} of {rows.length} rows valid
          </FPLabel>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[13px] text-fp-text-dim">
          Parsed course options will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <FPSlotTable
            columns={[
              { key: "code", header: "Course", render: (row: ParsedImportRow) => <span className="font-fp-mono text-fp-text-strong">{row.courseCode || "Unknown"}</span> },
              { key: "name", header: "Name", render: (row: ParsedImportRow) => row.courseName || "Unknown" },
              { key: "prof", header: "Professor", render: (row: ParsedImportRow) => row.professorName || "Unknown" },
              { key: "theory", header: "Theory", render: (row: ParsedImportRow) => row.theorySlots || "None" },
              { key: "lab", header: "Lab", render: (row: ParsedImportRow) => row.labSlots || "None" },
              { key: "credits", header: "Credits", render: (row: ParsedImportRow) => String(row.credits || 3) }
            ]}
            rows={rows}
            rowKey={(row) => row.id}
          />
        </div>
      )}
    </div>
  );
}
