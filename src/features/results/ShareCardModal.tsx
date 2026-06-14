"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campus, ScoredTimetable, ShareCardSize, TimeSlot } from "@/engine/types";
import { captureShareCard, copyShareCardToClipboard } from "@/lib/export/captureShareCard";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { ShareCard } from "./ShareCard";

type Props = {
  open: boolean;
  onClose: () => void;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
};

export function ShareCardModal({ open, onClose, schedule, slots }: Props) {
  const campus = (useAppStore((state) => state.campus) ?? "chennai") as Campus;
  const [activeSize, setActiveSize] = useState<ShareCardSize>("square");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const cardId = `share-card-${activeSize}`;
  const semesterLabel = "Current semester";

  const handleDownload = useCallback(async () => {
    setIsCapturing(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      await captureShareCard(cardId, activeSize, "my-ffcs-timetable");
      toast.success("Share image downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export image.");
    } finally {
      setIsCapturing(false);
    }
  }, [activeSize, cardId]);

  const handleCopy = useCallback(async () => {
    setIsCopying(true);
    try {
      await copyShareCardToClipboard(cardId, activeSize);
      toast.success("Share image copied.");
    } catch {
      toast.error("Copy is not available in this browser. Try download instead.");
    } finally {
      setIsCopying(false);
    }
  }, [activeSize, cardId]);

  if (!open) {
    return null;
  }

  return (
    <>
      <ShareCard
        id="share-card-square"
        size="square"
        schedule={schedule}
        slots={slots}
        campus={campus}
        semesterLabel={semesterLabel}
      />
      <ShareCard
        id="share-card-story"
        size="story"
        schedule={schedule}
        slots={slots}
        campus={campus}
        semesterLabel={semesterLabel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
        <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Share your timetable</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Export a polished PNG for chats and stories.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["square", "story"] as ShareCardSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setActiveSize(size)}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition",
                  activeSize === size
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-hairline text-muted-foreground hover:bg-surface-soft hover:text-ink"
                )}
              >
                <span className="block text-sm font-semibold capitalize">{size}</span>
                <span className="mt-1 block text-xs opacity-70">
                  {size === "square" ? "1080 x 1080" : "1080 x 1920"}
                </span>
              </button>
            ))}
          </div>

          <div
            className={cn(
              "mt-5 flex items-center justify-center rounded-md border border-hairline bg-[#080a0f] text-sm text-slate-400",
              activeSize === "story" ? "aspect-[9/16]" : "aspect-square"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-7 w-7" />
              <span>PNG preview will render on export</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              className="flex-1"
              onClick={handleDownload}
              disabled={isCapturing}
            >
              <Download className="h-4 w-4" />
              {isCapturing ? "Generating..." : "Download PNG"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={isCopying}
            >
              <Copy className="h-4 w-4" />
              {isCopying ? "Copying" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
