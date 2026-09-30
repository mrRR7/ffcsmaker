"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download, X } from "lucide-react";
import { FPButton } from "@/components/fp-ui/button";
import { Campus, ScoredTimetable, TimeSlot } from "@/engine/types";
import {
  captureShareCard,
  copyShareCardToClipboard
} from "@/lib/export/captureShareCard";
import { useAppStore } from "@/store/useAppStore";
import { ShareCard, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from "./ShareCard";

const CARD_ID = "share-card-export";

type Props = {
  open: boolean;
  onClose: () => void;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
};

export function ShareCardModal({ open, onClose, schedule, slots }: Props) {
  const campus = (useAppStore((state) => state.campus) ?? "chennai") as Campus;
  const courses = useAppStore((state) => state.courses);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const semesterLabel = "Current semester";

  useEffect(() => {
    if (!open || !containerRef.current || !wrapperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const scale = width / SHARE_CARD_WIDTH;
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `scale(${scale})`;
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  const handleDownload = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Brief delay so the fixed off-screen node is definitely rendered
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      await captureShareCard(CARD_ID, "my-ffcs-timetable");
      toast.success("Share image downloaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export image."
      );
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    setIsCopying(true);
    try {
      await copyShareCardToClipboard(CARD_ID);
      toast.success("Share image copied.");
    } catch {
      toast.error("Copy is not available in this browser. Try download instead.");
    } finally {
      setIsCopying(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      {/* Off-screen capture target — full resolution, invisible */}
      <ShareCard
        id={CARD_ID}
        schedule={schedule}
        slots={slots}
        courses={courses}
        campus={campus}
        semesterLabel={semesterLabel}
      />

      {/* Modal overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-card-title"
          className="w-full max-w-lg rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between gap-4 px-5 pt-5">
            <div>
              <h2 id="share-card-title" className="font-fp-display text-[17px] font-bold text-fp-text-strong">
                Share your timetable
              </h2>
              <p className="mt-0.5 text-[length:var(--text-small)] text-fp-text-dim">
                Export a polished PNG of your schedule.
              </p>
            </div>
            <FPButton type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </FPButton>
          </div>

          {/* Live preview — responsive scaling */}
          <div className="mt-4 px-5">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-[#0b0e11]"
              style={{ paddingBottom: `${(SHARE_CARD_HEIGHT / SHARE_CARD_WIDTH) * 100}%` }}
            >
              <div
                ref={wrapperRef}
                className="absolute left-0 top-0 origin-top-left pointer-events-none"
                style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}
              >
                <ShareCard
                  id="share-card-preview"
                  schedule={schedule}
                  slots={slots}
                  courses={courses}
                  campus={campus}
                  semesterLabel={semesterLabel}
                />
              </div>
            </div>
            <p className="mt-2 text-center text-[length:var(--text-micro)] text-fp-text-dim">
              Preview · exports as 1200 × 630 PNG
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 pb-5 pt-4">
            <FPButton
              type="button"
              className="flex-1 justify-center"
              onClick={handleDownload}
              disabled={isCapturing || isCopying}
            >
              <Download className="h-4 w-4" />
              {isCapturing ? "Generating…" : "Download PNG"}
            </FPButton>
            <FPButton
              type="button"
              variant="secondary"
              onClick={handleCopy}
              disabled={isCapturing || isCopying}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
              {isCopying ? "Copying…" : "Copy"}
            </FPButton>
          </div>
        </div>
      </div>
    </>
  );
}
