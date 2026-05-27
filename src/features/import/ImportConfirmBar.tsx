"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ImportConfirmBar({
  validCount,
  onCancel,
  onConfirm
}: {
  validCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center text-center p-8 border border-border rounded-lg bg-card/50">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Ready to Import</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          You are about to import {validCount} valid {validCount === 1 ? 'row' : 'rows'}. 
          These will be merged with your existing planner courses and professor options.
        </p>
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm and Import
          </Button>
        </div>
      </div>
    </div>
  );
}
