"use client";

import { toPng } from "html-to-image";
import { SHARE_CARD_DIMENSIONS, ShareCardSize } from "@/engine/types";

export async function captureShareCard(
  elementId: string,
  size: ShareCardSize,
  filename = "ffcs-timetable"
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Share card element #${elementId} not found`);
  }

  const { width, height } = SHARE_CARD_DIMENSIONS[size];
  const dataUrl = await toPng(element, {
    width,
    height,
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
  link.download = `${filename}-${size}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyShareCardToClipboard(
  elementId: string,
  size: ShareCardSize
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Share card element not found");
  }

  const { width, height } = SHARE_CARD_DIMENSIONS[size];
  const dataUrl = await toPng(element, { width, height, pixelRatio: 1 });
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob })
  ]);
}
