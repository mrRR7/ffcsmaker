"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VtopCatalogDiff } from "@/lib/vtopImport/compareCatalog";
import type { PlannerImportJSON } from "../types";

interface VtopImportConfirmDialogProps {
  open: boolean;
  loading?: boolean;
  payload: PlannerImportJSON | null;
  diff: VtopCatalogDiff | null;
  onConfirm: () => void;
  onClose: () => void;
}

function DiffStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  if (value <= 0) return null;

  return (
    <div className="flex items-center justify-between rounded-md border border-hairline bg-surface-soft/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={highlight ? "success" : "default"}>+{value}</Badge>
    </div>
  );
}

export function VtopImportConfirmDialog({
  open,
  loading = false,
  payload,
  diff,
  onConfirm,
  onClose,
}: VtopImportConfirmDialogProps) {
  if (!open) return null;

  const stats = diff?.stats;
  const hasChanges =
    (stats?.newCourseCount ?? 0) > 0 ||
    (stats?.newFacultyCount ?? 0) > 0 ||
    (stats?.slotChangeCount ?? 0) > 0 ||
    (stats?.creditChangeCount ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtop-import-confirm-title"
        className="w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle id="vtop-import-confirm-title" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              New VTOP data detected
            </CardTitle>
            <CardDescription>
              {loading
                ? "Loading your scraped registration data…"
                : payload
                  ? `Ready to import ${stats?.courseCount ?? payload.courses.length} courses from VTOP.`
                  : "Unable to load import data."}
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-hairline bg-canvas/40 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Courses</p>
                  <p className="text-lg font-semibold text-foreground">{stats.courseCount}</p>
                </div>
                <div className="rounded-md border border-hairline bg-canvas/40 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Faculty options</p>
                  <p className="text-lg font-semibold text-foreground">
                    {stats.optionCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {hasChanges ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Changes vs catalog</p>
                  <DiffStat label="New courses" value={stats.newCourseCount} highlight />
                  <DiffStat label="New faculty" value={stats.newFacultyCount} highlight />
                  <DiffStat label="Slot changes" value={stats.slotChangeCount} />
                  <DiffStat label="Credit changes" value={stats.creditChangeCount} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Scraped data matches the current catalog. You can still import to load your exact
                  VTOP registration options.
                </p>
              )}
            </>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={onConfirm} disabled={loading || !payload}>
              Import now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
