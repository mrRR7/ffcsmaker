import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FPLabel } from "@/components/fp-ui/label";
import { FPSlotTable } from "@/components/fp-ui/slot-table";
import { OpenPlannerLink } from "@/features/campus/OpenPlannerLink";
import {
  CAMPUS_FACTS,
  CAMPUS_PAGE_IDS,
  PLANNER_READY,
  campusLabel,
  isCampusPageId,
  slotDaysText,
  slotRows,
  type SlotRow
} from "@/features/campus/campusPages";

// Only the listed campuses exist; any other single-segment path stays a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CAMPUS_PAGE_IDS.map((campus) => ({ campus }));
}

export function generateMetadata({ params }: { params: { campus: string } }): Metadata {
  if (!isCampusPageId(params.campus)) return {};
  const label = campusLabel(params.campus);
  const ready = PLANNER_READY[params.campus];
  return {
    title: ready ? `${label} FFCS Planner & Slot Timings` : `${label} FFCS Slot Timings`,
    description: ready
      ? `Every ${label} FFCS slot with its day and time, plus a free planner that finds every clash-free timetable for your courses. No login.`
      : `Every ${label} FFCS theory and lab slot with its day and time, in one chart. Free, no login.`,
    alternates: { canonical: `/${params.campus}` }
  };
}

const slotColumns = [
  { key: "slot", header: "Slot", render: (row: SlotRow) => <span className="fp-code text-fp-text-strong">{row.label}</span> },
  { key: "when", header: "Meets", render: (row: SlotRow) => row.times.join(" · ") }
];

export default function CampusPage({ params }: { params: { campus: string } }) {
  if (!isCampusPageId(params.campus)) notFound();
  const campus = params.campus;
  const label = campusLabel(campus);
  const ready = PLANNER_READY[campus];
  const rows = slotRows(campus);
  const theory = rows.filter((row) => row.kind === "theory");
  const labs = rows.filter((row) => row.kind === "lab");

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <header className="space-y-4">
        <FPLabel tone="accent" variant="eyebrow">FFCS · {label}</FPLabel>
        <h1 className="font-fp-display text-[30px] font-bold leading-[1.1] tracking-[-0.01em] text-fp-text-strong sm:text-[36px]">
          {ready ? `${label} FFCS planner & slot timings` : `${label} FFCS slot timings`}
        </h1>
        {ready ? (
          <>
            <p className="max-w-2xl text-[length:var(--text-body-size)] leading-[1.6] text-fp-text-body">
              Pick your {label} courses, tick every professor you&apos;d take, and the planner lists every clash-free week,
              best first. Free, no login. Below is the full {label} slot chart the planner uses.
            </p>
            <OpenPlannerLink campus={campus} />
          </>
        ) : (
          <p className="max-w-2xl text-[length:var(--text-body-size)] leading-[1.6] text-fp-text-body">
            The full {label} slot chart: every theory and lab slot with its day and time. The planner doesn&apos;t support{" "}
            {label} yet because its course catalog is still being added, so use this chart to check your slots for clashes
            until then.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">How {label} slots work</h2>
        <ul className="list-disc space-y-2 pl-5 text-[length:var(--text-body-size)] leading-[1.6] text-fp-text-body">
          <li>Classes are scheduled {slotDaysText(campus)}.</li>
          {CAMPUS_FACTS[campus].map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">
          {labs.length ? "Theory slot timings" : "Slot timings"}
        </h2>
        <FPSlotTable columns={slotColumns} rows={theory} rowKey={(row) => row.label} />
      </section>

      {labs.length ? (
        <section className="space-y-3">
          <h2 className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">Lab slot timings</h2>
          <FPSlotTable columns={slotColumns} rows={labs} rowKey={(row) => row.label} />
        </section>
      ) : null}

      <section className="space-y-3 border-t border-fp-border-default pt-8 text-[length:var(--text-small)] leading-[1.6] text-fp-text-dim">
        <p>
          {ready ? "These are the timings the planner uses." : "These are the timings the planner will use."} VIT can change them between semesters, so check the official slot chart on
          VTOP before you register.
        </p>
        <p>
          Other campuses:{" "}
          {CAMPUS_PAGE_IDS.filter((other) => other !== campus).map((other, index) => (
            <span key={other}>
              {index > 0 ? " · " : null}
              <Link prefetch={false} href={`/${other}`} className="text-fp-text-body underline underline-offset-[3px] hover:text-fp-accent">
                {campusLabel(other)}
              </Link>
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
