"use client";

import { toPng } from "html-to-image";
import { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from "@/features/results/ShareCard";

export async function captureShareCard(
  elementId: string,
  filename = "ffcs-timetable"
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Share card element #${elementId} not found`);
  }

  const dataUrl = await toPng(element, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: false,
    style: {
      transform: "none",
      opacity: "1"
    }
  });

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.open(dataUrl, "_blank");
    return;
  }

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyShareCardToClipboard(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Share card element not found");
  }

  const dataUrl = await toPng(element, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    pixelRatio: 1
  });
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob })
  ]);
}
