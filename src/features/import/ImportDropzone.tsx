"use client";

import { useCallback, useState } from "react";
import { UploadCloud, Download } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { parseCsvFile } from "./importCsv";
import { parseXlsxFile } from "./importXlsx";
import { ImportRow } from "./importTypes";

export function ImportDropzone({ onParsed }: { onParsed: (rows: ImportRow[]) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

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
      onParsed(rows);
    } catch (err) {
      toast.error("Failed to parse file.");
    } finally {
      setIsProcessing(false);
    }
  }, [onParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  function downloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8,courseCode,courseName,professorName,theorySlots,labSlots,credits,locked,notes\nCSE1001,Problem Solving,John Doe,\"A1, TA1\",\"L1, L2\",3,false,Great professor";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ultimate-ffcs-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary/40"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-semibold">
          {isDragActive ? "Drop the file here" : "Drag & drop a CSV or XLSX file here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">or click to select a file</p>
        {isProcessing && <p className="mt-2 text-sm text-primary">Processing...</p>}
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" />
        Download Template
      </Button>
    </div>
  );
}
