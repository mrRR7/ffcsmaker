"use client";

import { usePendingVtopImport } from "../hooks/usePendingVtopImport";
import { VtopImportConfirmDialog } from "./VtopImportConfirmDialog";

export function VtopImportHandler() {
  const { pending, isLoading, dismissPending, confirmImport } = usePendingVtopImport();

  return (
    <VtopImportConfirmDialog
      open={Boolean(pending)}
      loading={isLoading}
      payload={pending?.payload ?? null}
      diff={pending?.diff ?? null}
      onConfirm={confirmImport}
      onClose={dismissPending}
    />
  );
}
