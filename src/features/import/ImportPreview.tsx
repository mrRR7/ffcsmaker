"use client";

import { useMemo, useState } from "react";
import { ParsedImportRow } from "./importTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";

export function ImportPreview({
  rows,
  onCancel,
  onNext,
  onUpdateRow
}: {
  rows: ParsedImportRow[];
  onCancel: () => void;
  onNext: () => void;
  onUpdateRow: (id: string, updates: Partial<ParsedImportRow>) => void;
}) {
  const validRows = rows.filter(r => r.isValid);
  
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

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (groupedCourses.length <= 5) {
      groupedCourses.forEach(([code]) => { initial[code] = true; });
    }
    return initial;
  });

  function toggleCourse(code: string) {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-lg border border-border">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Extracted Courses
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Found {validRows.length} valid options across {groupedCourses.length} courses.
          </p>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
        {groupedCourses.map(([code, { name, rows }]) => {
          const isExpanded = !!expanded[code];
          return (
            <div key={code} className="border border-border rounded-md overflow-hidden bg-card/40">
              <button 
                type="button"
                onClick={() => toggleCourse(code)}
                className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold tracking-wide">{code}</span>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">- {name}</span>
                </div>
                <Badge className="bg-background border-border text-muted-foreground">
                  {rows.length} {rows.length === 1 ? 'option' : 'options'}
                </Badge>
              </button>
              
              {isExpanded && (
                <div className="p-0">
                  <table className="w-full text-sm text-left border-t border-border">
                    <thead className="bg-secondary/10">
                      <tr>
                        <th className="p-2 pl-9 font-medium text-muted-foreground text-xs uppercase tracking-wider">Professor</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Theory</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Lab</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rows.map((row) => (
                        <tr key={row.id} className="bg-background/40 hover:bg-background/80 transition-colors">
                          <td className="p-2 pl-9 whitespace-nowrap">
                            <Input 
                              value={row.professorName}
                              onChange={(e) => onUpdateRow(row.id, { professorName: e.target.value })}
                              className="h-7 text-xs w-full max-w-[200px]"
                            />
                          </td>
                          <td className="p-2 whitespace-nowrap hidden sm:table-cell">
                            <Input 
                              value={row.theorySlots || ""}
                              onChange={(e) => onUpdateRow(row.id, { theorySlots: e.target.value })}
                              className="h-7 text-xs w-full max-w-[120px]"
                              placeholder="e.g. A1+TA1"
                            />
                          </td>
                          <td className="p-2 whitespace-nowrap hidden sm:table-cell">
                            <Input 
                              value={row.labSlots || ""}
                              onChange={(e) => onUpdateRow(row.id, { labSlots: e.target.value })}
                              className="h-7 text-xs w-full max-w-[120px]"
                              placeholder="e.g. L1+L2"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onNext}>
          Continue to Confirmation
        </Button>
      </div>
    </div>
  );
}
