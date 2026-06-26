"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/utils/cn";
import { getBookmarkletHref } from "../bookmarkletGenerator";

interface BookmarkletButtonProps {
  className?: string;
}

export function BookmarkletButton({ className }: BookmarkletButtonProps) {
  const href = getBookmarkletHref();

  return (
    <a
      href={href}
      draggable
      onClick={(event) => event.preventDefault()}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/uri-list", href);
        event.dataTransfer.setData("text/plain", href);
        event.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "inline-flex cursor-grab select-none items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 active:cursor-grabbing dark:text-emerald-300",
        className
      )}
      title="Drag to your bookmarks bar"
    >
      <Bookmark className="h-4 w-4 shrink-0" />
      Ultimate FFCS Scraper
    </a>
  );
}
