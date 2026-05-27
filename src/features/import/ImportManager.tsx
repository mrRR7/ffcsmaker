"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ImportDropzone } from "./ImportDropzone";
import { ImportPreview } from "./ImportPreview";
import { ImportValidationPanel } from "./ImportValidationPanel";
import { ImportConfirmBar } from "./ImportConfirmBar";
import { ImportStepper, ImportStep } from "./ImportStepper";
import { ImportRow, ParsedImportRow } from "./importTypes";
import { validateAndParseRow } from "./validateImport";
import { transformToCourses } from "./transformImport";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ImportManager() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  
  const setCourses = useAppStore((state) => (state as any).setCourses);
  const setConstraint = useAppStore((state) => state.setConstraint);

  function handleParsed(rows: ImportRow[]) {
    if (rows.length === 0) {
      toast.error("File is empty or could not be read.");
      return;
    }
    const validated = rows.map((row) => validateAndParseRow(row, slots));
    setParsedRows(validated);
    
    // Auto-skip Detect step if 0 invalid rows
    const invalidCount = validated.filter(r => !r.isValid).length;
    if (invalidCount === 0) {
      setStep("review");
    } else {
      setStep("detect");
    }
  }

  function handleUpdateRow(id: string, updates: Partial<ParsedImportRow>) {
    setParsedRows(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row));
  }

  function handleProceedFromDetect() {
    setStep("review");
  }

  function handleProceedFromReview() {
    setStep("confirm");
  }

  function handleCancel() {
    setParsedRows([]);
    setStep("upload");
  }

  function handleImport() {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      handleCancel();
      return;
    }

    try {
      const { updatedCourses, locks } = transformToCourses(validRows, courses, slots);
      
      if (setCourses) {
         setCourses(updatedCourses);
      } else {
         useAppStore.setState({ courses: updatedCourses });
      }

      if (locks.length > 0) {
        setConstraint("professorLocks", Array.from(new Set([...constraints.professorLocks, ...locks])));
      }

      toast.success(`Imported ${validRows.length} options successfully.`);
      handleCancel();
    } catch (err) {
      toast.error("Failed to merge imported data.");
    }
  }

  const validCount = parsedRows.filter(r => r.isValid).length;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Bulk Import</CardTitle>
        <CardDescription>
          Instantly set up your semester planner by uploading your courses from a spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ImportStepper currentStepId={step} />
        
        <div className="mt-6">
          {step === "upload" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ImportDropzone onParsed={handleParsed} />
            </div>
          )}
          {step === "detect" && (
            <ImportValidationPanel 
              rows={parsedRows} 
              onCancel={handleCancel} 
              onProceed={handleProceedFromDetect} 
            />
          )}
          {step === "review" && (
            <ImportPreview 
              rows={parsedRows} 
              onCancel={handleCancel} 
              onNext={handleProceedFromReview} 
              onUpdateRow={handleUpdateRow}
            />
          )}
          {step === "confirm" && (
            <ImportConfirmBar 
              validCount={validCount} 
              onCancel={handleCancel} 
              onConfirm={handleImport} 
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
