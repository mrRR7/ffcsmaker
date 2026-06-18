"use client";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { buildCourseSummaryRows, buildMatrixCells, buildMatrixColumns } from "@/features/results/timetableMatrix";

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
  downloadUrl(url, `ultimate-ffcs-${schedule.id}.json`);
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

function drawTextBox(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  fontSize: number,
  color: [number, number, number],
  bold = false
) {
  pdf.setFontSize(fontSize);
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  const lines = pdf.splitTextToSize(text, width);
  pdf.text(lines, x, y, { baseline: "top" });
  return y + lines.length * lineHeight;
}

function drawTableCell(
  pdf: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: [number, number, number];
    stroke?: [number, number, number];
    text?: string;
    textColor?: [number, number, number];
    fontSize?: number;
    bold?: boolean;
    align?: "left" | "center" | "right";
  }
) {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke = [148, 163, 184],
    text,
    textColor = [15, 23, 42],
    fontSize = 8,
    bold = false,
    align = "center"
  } = options;

  if (fill) {
    pdf.setFillColor(fill[0], fill[1], fill[2]);
    pdf.rect(x, y, width, height, "F");
  }
  pdf.setDrawColor(stroke[0], stroke[1], stroke[2]);
  pdf.rect(x, y, width, height);

  if (text) {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    const lines = pdf.splitTextToSize(text, width - 8);
    const textHeight = lines.length * (fontSize + 1);
    const textY = y + Math.max(2, (height - textHeight) / 2);
    pdf.text(lines, x + width / 2, textY, { align, baseline: "top" });
  }
}

function tintColor(hex?: string) {
  const fallback = [20, 184, 166] as [number, number, number];
  if (!hex) return fallback;
  const value = hex.replace("#", "");
  if (value.length !== 6) return fallback;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return fallback;
  }
  return [red, green, blue] as [number, number, number];
}

export async function exportTimetablePdf(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[]
) {
  console.log("PDF FUNCTION ENTERED");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1760, 1240]
  });

  const width = 1760;
  const height = 1240;
  const margin = 36;
  const summaryRows = buildCourseSummaryRows(schedule, slots, courses);
  const columns = buildMatrixColumns(slots);
  const matrix = buildMatrixCells(schedule, slots, courses);
  const totalCredits = schedule.selections.reduce((sum, selection) => sum + selection.credits, 0);

  const paintPage = () => {
    pdf.setFillColor(2, 6, 23);
    pdf.rect(0, 0, width, height, "F");
  };

  paintPage();

  let cursorY = margin;
  cursorY = drawTextBox(
    pdf,
    `Schedule ${schedule.id}`,
    margin,
    cursorY,
    width - margin * 2,
    20,
    22,
    [240, 253, 250],
    true
  );
  cursorY += 6;
  cursorY = drawTextBox(
    pdf,
    `${schedule.rankingMode} | Score ${schedule.score} | ${totalCredits} credits | ${schedule.metrics.freeDays} free days | ${schedule.metrics.totalGapSlots} gap slots | ends ${schedule.metrics.latestEndTime}`,
    margin,
    cursorY,
    width - margin * 2,
    16,
    11,
    [148, 163, 184],
    false
  );

  cursorY += 18;
  cursorY = drawTextBox(
    pdf,
    "Professor and slot selection summary",
    margin,
    cursorY,
    width - margin * 2,
    16,
    12,
    [226, 232, 240],
    true
  );

  const summaryHeaderY = cursorY + 8;
  const summaryColumns = [160, 240, 94, 290, 290, 78];
  const summaryX = [margin];
  for (let index = 0; index < summaryColumns.length - 1; index += 1) {
    summaryX.push(summaryX[index] + summaryColumns[index]);
  }
  const summaryTitles = ["Course", "Professor", "Type", "Theory slots", "Lab slots", "Credits"];

  let y = summaryHeaderY;
  const drawSummaryHeader = () => {
    summaryTitles.forEach((title, index) => {
      drawTableCell(pdf, {
        x: summaryX[index],
        y,
        width: summaryColumns[index],
        height: 28,
        fill: [15, 23, 42],
        stroke: [51, 65, 85],
        text: title,
        textColor: [226, 232, 240],
        fontSize: 9,
        bold: true
      });
    });
    y += 28;
  };

  drawSummaryHeader();
  summaryRows.forEach((row) => {
    const accent = tintColor(row.color);
    const rowHeight = 34;
    if (y + rowHeight > height - margin - 28) {
      pdf.addPage();
      paintPage();
      y = margin;
      drawSummaryHeader();
    }

    const values = [
      `${row.courseCode}\n${row.courseName}`,
      row.professorName,
      row.typeLabel,
      row.theorySlots.length ? row.theorySlots.join(" | ") : "-",
      row.labSlots.length ? row.labSlots.join(" | ") : "-",
      String(row.credits)
    ];

    values.forEach((value, index) => {
      drawTableCell(pdf, {
        x: summaryX[index],
        y,
        width: summaryColumns[index],
        height: rowHeight,
        fill: index === 0 ? [accent[0], accent[1], accent[2]] : [15, 23, 42],
        stroke: [51, 65, 85],
        text: value,
        textColor: index === 0 ? [255, 255, 255] : [226, 232, 240],
        fontSize: index === 0 ? 10 : 9,
        bold: index === 0
      });
    });
    y += rowHeight;
  });

  pdf.addPage();
  paintPage();

  cursorY = margin;
  cursorY = drawTextBox(
    pdf,
    `Schedule ${schedule.id}`,
    margin,
    cursorY,
    width - margin * 2,
    20,
    22,
    [240, 253, 250],
    true
  );
  cursorY += 6;
  cursorY = drawTextBox(
    pdf,
    `Full timetable matrix | ${schedule.rankingMode} | Score ${schedule.score} | ${totalCredits} credits`,
    margin,
    cursorY,
    width - margin * 2,
    16,
    11,
    [148, 163, 184],
    false
  );

  const tableStartY = cursorY + 24;
  const stubOne = 100;
  const stubTwo = 86;
  const slotWidth = (width - margin * 2 - stubOne - stubTwo) / 13;
  const tableColumns = [stubOne, stubTwo, ...Array.from({ length: 13 }, () => slotWidth)];
  const tableX = [margin];
  for (let index = 0; index < tableColumns.length - 1; index += 1) {
    tableX.push(tableX[index] + tableColumns[index]);
  }
  const theoryColumns = columns.theory;
  const labColumns = columns.lab;

  const drawMatrixHeader = (
    startY: number,
    track: "THEORY" | "LAB",
    columnsForTrack: typeof theoryColumns
  ) => {
    drawTableCell(pdf, {
      x: tableX[0],
      y: startY,
      width: stubOne,
      height: 24,
      fill: [15, 23, 42],
      stroke: [51, 65, 85],
      text: track,
      textColor: [226, 232, 240],
      fontSize: 10,
      bold: true
    });
    drawTableCell(pdf, {
      x: tableX[1],
      y: startY,
      width: stubTwo,
      height: 24,
      fill: [30, 41, 59],
      stroke: [51, 65, 85],
      text: "Start",
      textColor: [226, 232, 240],
      fontSize: 9,
      bold: true
    });
    columnsForTrack.forEach((column, index) => {
      drawTableCell(pdf, {
        x: tableX[index + 2],
        y: startY,
        width: tableColumns[index + 2],
        height: 24,
        fill: [15, 23, 42],
        stroke: [51, 65, 85],
        text: column.kind === "lunch" ? "Lunch" : column.startTime ?? "",
        textColor: [226, 232, 240],
        fontSize: 8,
        bold: true
      });
    });

    const endRowY = startY + 24;
    drawTableCell(pdf, {
      x: tableX[1],
      y: endRowY,
      width: stubTwo,
      height: 24,
      fill: [30, 41, 59],
      stroke: [51, 65, 85],
      text: "End",
      textColor: [226, 232, 240],
      fontSize: 9,
      bold: true
    });
    columnsForTrack.forEach((column, index) => {
      drawTableCell(pdf, {
        x: tableX[index + 2],
        y: endRowY,
        width: tableColumns[index + 2],
        height: 24,
        fill: [15, 23, 42],
        stroke: [51, 65, 85],
        text: column.kind === "lunch" ? "Lunch" : column.endTime ?? "",
        textColor: [226, 232, 240],
        fontSize: 8,
        bold: true
      });
    });

    return endRowY + 24;
  };

  let matrixY = tableStartY;
  matrixY = drawMatrixHeader(matrixY, "THEORY", theoryColumns);
  matrixY = drawMatrixHeader(matrixY + 8, "LAB", labColumns);

  const drawMatrixRows = (
    startY: number,
    rows: typeof matrix.theory,
    track: "THEORY" | "LAB"
  ) => {
    let rowY = startY;
    rows.forEach((row, rowIndex) => {
      const day = row[0]?.day ?? "";
      const rowHeight = 46;

      drawTableCell(pdf, {
        x: tableX[0],
        y: rowY,
        width: stubOne,
        height: rowHeight,
        fill: [30, 41, 59],
        stroke: [51, 65, 85],
        text: day.slice(0, 3).toUpperCase(),
        textColor: [226, 232, 240],
        fontSize: 10,
        bold: true
      });

      drawTableCell(pdf, {
        x: tableX[1],
        y: rowY,
        width: stubTwo,
        height: rowHeight,
        fill: [15, 23, 42],
        stroke: [51, 65, 85],
        text: track,
        textColor: [226, 232, 240],
        fontSize: 9,
        bold: true
      });

      row.forEach((cell, index) => {
        const isLunch = cell.slotLabel === "Lunch";
        const fill: [number, number, number] = isLunch
          ? [30, 41, 59]
          : cell.occupied
            ? tintColor(cell.color)
            : [15, 23, 42];
        const textColor: [number, number, number] = isLunch || cell.occupied ? [255, 255, 255] : [226, 232, 240];
        const text = isLunch
          ? "Lunch"
          : cell.occupied
            ? `${cell.courseCode}\n${cell.professorName}`
            : `${cell.slotLabel}\n${cell.startTime}-${cell.endTime}`;

        drawTableCell(pdf, {
          x: tableX[index + 2],
          y: rowY,
          width: tableColumns[index + 2],
          height: rowHeight,
          fill,
          stroke: [51, 65, 85],
          text,
          textColor,
          fontSize: cell.occupied ? 9 : 8,
          bold: Boolean(cell.occupied)
        });
      });

      rowY += rowHeight;
    });
    return rowY;
  };

  const theoryRowsEnd = drawMatrixRows(matrixY, matrix.theory, "THEORY");
  drawMatrixRows(theoryRowsEnd + 20, matrix.lab, "LAB");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Exported ${format(new Date(), "PPpp")}`, margin, height - 26);
  pdf.text(
    `Selected courses: ${schedule.selections.length} | Free days: ${schedule.metrics.freeDays} | Gaps: ${schedule.metrics.totalGapSlots} | Compactness: ${schedule.metrics.compactness}`,
    width - margin,
    height - 26,
    { align: "right" }
  );

  pdf.save(`ultimate-ffcs-${schedule.id}.pdf`);
}
