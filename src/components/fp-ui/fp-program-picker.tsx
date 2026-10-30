"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";
import { loadCatalog } from "@/lib/catalogCache";
import { catalogPrograms, programLabel, programNoun } from "@/features/programs/programCatalog";
import { FPLabel } from "@/components/fp-ui/label";

const SEARCH_THRESHOLD = 8;

// localStorage can throw (private mode, blocked storage); the flag is only a hint.
function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** True when this campus was last seen with no tagged programs (nothing to pick). */
export function campusHasNoPrograms(campus: Campus) {
  return readFlag(`fp-no-programs:${campus}`);
}

function writeFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // Without storage the next visit just shows the placeholder again.
  }
}

/**
 * Second half of the campus gate: one tap to pick a program. It lists only
 * programs with data in the active catalog. With none (nothing tagged yet, or
 * the catalog failed) it steps aside without saving an answer, so the picker
 * still shows once tagged data lands.
 *
 * A campus last seen with no programs renders the planner straight away and
 * re-checks in the background, so the picker never flashes up and vanishes
 * on every visit. It only takes over if programs have since appeared.
 */
export function FPProgramPicker({ campus, children }: { campus: Campus; children: React.ReactNode }) {
  const setProgram = useAppStore((state) => state.setProgram);
  const resetCampus = useAppStore((state) => state.resetCampus);
  const noneKey = `fp-no-programs:${campus}`;
  const [programs, setPrograms] = useState<string[] | null>(() => (readFlag(noneKey) ? [] : null));
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadCatalog(campus)
      .then((entry) => {
        const list = catalogPrograms(entry.courses);
        writeFlag(noneKey, list.length === 0);
        if (!cancelled) setPrograms(list);
      })
      // A failed load says nothing about programs: don't remember it.
      .catch(() => !cancelled && setPrograms([]));
    return () => {
      cancelled = true;
    };
  }, [campus, noneKey]);

  if (programs?.length === 0) return <>{children}</>;

  if (programs === null) {
    // Neutral placeholder, not the picker: most loads end with no programs.
    // Keeps the campus tour step's target so the tour waits through it.
    return (
      <div
        data-tour-id="campus-picker"
        aria-busy="true"
        aria-label="Loading"
        className="mx-auto mt-20 h-32 max-w-lg animate-pulse rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface"
      />
    );
  }

  const needle = query.trim().toLowerCase();
  // Vellore tags by school, everywhere else by program.
  const noun = programNoun(campus);
  const visible = programs.filter(
    (code) => !needle || code.toLowerCase().includes(needle) || programLabel(code).toLowerCase().includes(needle)
  );
  const optionClass =
    "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface px-4 py-3 text-left transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-fp-border-accent active:scale-[0.98]";

  return (
    <div className="flex min-h-[calc(100vh-14rem)] justify-center py-8">
      {/* Same tour target as the campus gate: the tour's campus step waits through this too. */}
      <div data-tour-id="campus-picker" className="w-full max-w-2xl">
        <FPLabel tone="accent" variant="eyebrow">{CAMPUS_LABELS[campus]}</FPLabel>
        <h1 className="mt-3 font-fp-display text-[length:var(--text-display)] font-bold tracking-[-0.01em] text-fp-text-strong">
          Pick your {noun}
        </h1>
        <p className="mt-3 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-dim">
          Your {noun}&apos;s courses and professors show first in search. Every other course is still there.
        </p>

        <div className="mt-7 space-y-2.5">
          {programs.length > SEARCH_THRESHOLD ? (
            <input
              aria-label={`Search ${noun}s`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${noun}s`}
              className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-transparent bg-fp-bg-inset px-[14px] text-[length:var(--text-small)] text-fp-text-body placeholder:text-fp-text-dim focus:border-[var(--border-selected)] focus:outline-none"
            />
          ) : null}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {visible.map((code) => (
              <button key={code} type="button" onClick={() => setProgram(code)} className={optionClass}>
                <span className="text-[length:var(--text-small)] font-medium text-fp-text-strong">{programLabel(code)}</span>
                {programLabel(code) !== code ? (
                  <span className="font-fp-mono text-[length:var(--text-micro)] text-fp-text-dim">{code}</span>
                ) : null}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setProgram(null)} className={optionClass}>
            <span className="text-[length:var(--text-small)] text-fp-text-body">Other / my {noun} isn&apos;t listed</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fp-text-dim" strokeWidth={1.5} />
          </button>
        </div>

        <p className="mt-9 text-[length:var(--text-small)] text-fp-text-dim">
          Not at {CAMPUS_LABELS[campus]}?{" "}
          <button
            type="button"
            onClick={resetCampus}
            className="text-fp-text-body underline underline-offset-[3px] hover:text-fp-accent"
          >
            Change campus
          </button>
        </p>
      </div>
    </div>
  );
}
