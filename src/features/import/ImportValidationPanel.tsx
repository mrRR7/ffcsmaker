"use client";

import { ParsedImportRow } from "./importTypes";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function ImportValidationPanel({
  rows,
  onCancel,
  onProceed
}: {
  rows: ParsedImportRow[];
  onCancel: () => void;
  onProceed: () => void;
}) {
  const invalidRows = rows.filter(r => !r.isValid);
  const validCount = rows.length - invalidRows.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="mt-0.5 h-5 w-5" />
        <div className="space-y-1">
          <h4 className="font-medium leading-none tracking-tight">Issues detected</h4>
          <p className="text-sm opacity-90">
            We found {invalidRows.length} rows with missing or invalid data. 
            {validCount > 0 && ` You can proceed with the ${validCount} valid rows, or cancel and fix your file.`}
          </p>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-md border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/40 sticky top-0">
            <tr>
              <th className="p-3 font-medium text-muted-foreground">Code</th>
              <th className="p-3 font-medium text-muted-foreground">Professor</th>
              <th className="p-3 font-medium text-muted-foreground">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invalidRows.map((row) => (
              <tr key={row.id} className="bg-destructive/5">
                <td className="p-3 whitespace-nowrap">{row.courseCode || "N/A"}</td>
                <td className="p-3 whitespace-nowrap">{row.professorName || "N/A"}</td>
                <td className="p-3 text-destructive font-medium text-xs">
                  {row.errors.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border mt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="mt-4">
          Cancel Upload
        </Button>
        <Button type="button" onClick={onProceed} disabled={validCount === 0} className="mt-4">
          Discard Invalid and Proceed
        </Button>
      </div>
    </div>
  );
}
