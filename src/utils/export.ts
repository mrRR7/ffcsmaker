"use client";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ScoredTimetable } from "@/engine/types";

function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function exportScheduleJson(schedule: ScoredTimetable) {
  const blob = new Blob([JSON.stringify(schedule, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `unitime-${schedule.id}.json`);
  URL.revokeObjectURL(url);
}

export async function exportElementPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#020617",
    cacheBust: true
  });
  downloadUrl(dataUrl, filename);
}

export async function exportElementPdf(
  node: HTMLElement,
  schedule: ScoredTimetable
) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#020617",
    cacheBust: true
  });
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280, 820]
  });
  pdf.setFillColor(2, 6, 23);
  pdf.rect(0, 0, 1280, 820, "F");
  pdf.setFontSize(18);
  pdf.setTextColor(240, 253, 250);
  pdf.text(`UniTime Pro - ${schedule.rankingMode} - ${schedule.score}`, 40, 38);
  pdf.addImage(dataUrl, "PNG", 40, 58, 1200, 700);
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Exported ${format(new Date(), "PPpp")}`, 40, 790);
  pdf.save(`unitime-${schedule.id}.pdf`);
}
