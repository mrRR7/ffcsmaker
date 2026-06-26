"use client";

import { ExternalLink, MousePointerClick, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Campus } from "@/engine/types";
import { cn } from "@/utils/cn";
import { BookmarkletButton } from "./BookmarkletButton";
import { getVtopUrl } from "../types";

interface VtopImportModalProps {
  open: boolean;
  onClose: () => void;
  campus: Campus | null;
}

const STEPS = [
  {
    number: 1,
    title: "Open VTOP",
    body: "Log in to VTOP and navigate to Course Registration.",
  },
  {
    number: 2,
    title: "Drag this bookmark to your bookmarks bar",
    body: "Save the scraper bookmark so you can run it on any VTOP page.",
  },
  {
    number: 3,
    title: "Go to Course Registration",
    body: "Open the course allocation table, then click the bookmark. You'll see a confirmation before leaving VTOP.",
  },
  {
    number: 4,
    title: "Return here",
    body: "Click Open Ultimate FFCS when you're ready. The planner will show what's new and ask before importing.",
  },
] as const;

export function VtopImportModal({ open, onClose, campus }: VtopImportModalProps) {
  if (!open) return null;

  const vtopUrl = getVtopUrl(campus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtop-import-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle id="vtop-import-title">Import directly from VTOP</CardTitle>
            <CardDescription>
              Missing your course or faculty? Import your exact registration data
              directly from VTOP.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-3">
              <Badge
                variant="primary"
                className="mt-0.5 h-6 w-6 shrink-0 justify-center rounded-full p-0 text-xs font-bold"
              >
                {step.number}
              </Badge>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>

                {step.number === 1 ? (
                  <a
                    href={vtopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition hover:bg-primary-hover"
                  >
                    Open VTOP
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}

                {step.number === 2 ? (
                  <div className="space-y-2">
                    <BookmarkletButton />
                    <p className="text-xs text-muted-foreground">
                      Drag the button above to your browser&apos;s bookmarks bar.
                    </p>
                  </div>
                ) : null}

                {step.number === 3 ? (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-soft/40 p-6 text-center"
                    )}
                  >
                    <div className="space-y-2">
                      <MousePointerClick className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Click the bookmark while viewing your course allocation table.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
