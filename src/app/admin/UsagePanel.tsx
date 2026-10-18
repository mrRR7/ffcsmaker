import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FFCS_WINDOW_START } from "@/lib/site";
import { USAGE_EVENTS, type UsageEventName } from "@/lib/usageEvents";
import { FPPanel } from "@/components/fp-ui/panel";

type DailyRow = { name: string; campus: string | null; day: string; total: number };

const istDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const cell = "px-4 py-2 text-right tabular-nums";

export async function UsagePanel() {
  const today = istDay();
  const weekStart = istDay(-6);
  const from = weekStart < FFCS_WINDOW_START ? weekStart : FFCS_WINDOW_START;

  const { data, error } = await createSupabaseAdminClient()
    .from("usage_events_daily")
    .select("name, campus, day, total")
    .gte("day", from);
  const rows = (data ?? []) as DailyRow[];

  const sum = (name: string, since: string) =>
    rows.filter((r) => r.name === name && r.day >= since).reduce((n, r) => n + r.total, 0);

  const perCampus = new Map<string, number>();
  for (const r of rows) {
    if (r.name === "generate_completed" && r.day >= FFCS_WINDOW_START) {
      const key = r.campus ?? "unknown";
      perCampus.set(key, (perCampus.get(key) ?? 0) + r.total);
    }
  }

  return (
    <FPPanel title="Usage events" className="mb-5">
      {error ? (
        <p className="p-4 text-[length:var(--text-small)] text-fp-warn">Could not load events: {error.message}</p>
      ) : (
        <div className="overflow-x-auto text-[length:var(--text-small)]">
          <table className="w-full">
            <thead className="text-fp-text-dim">
              <tr className="border-b border-fp-border-default">
                <th className="px-4 py-2 text-left font-normal">Event</th>
                <th className={`${cell} font-normal`}>Today</th>
                <th className={`${cell} font-normal`}>Last 7 days</th>
                <th className={`${cell} font-normal`}>Since {FFCS_WINDOW_START}</th>
              </tr>
            </thead>
            <tbody className="text-fp-text-body">
              {(Object.keys(USAGE_EVENTS) as UsageEventName[]).map((name) => (
                <tr key={name} className="border-b border-fp-border-default last:border-0">
                  <td className="px-4 py-2 font-fp-mono">{name}</td>
                  <td className={cell}>{sum(name, today)}</td>
                  <td className={cell}>{sum(name, weekStart)}</td>
                  <td className={cell}>{sum(name, FFCS_WINDOW_START)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-fp-border-default px-4 py-3 text-fp-text-dim">
            generate_completed by campus since {FFCS_WINDOW_START}:{" "}
            {perCampus.size === 0
              ? "none yet"
              : Array.from(perCampus, ([campus, n]) => `${campus} ${n}`).join(" · ")}
          </p>
        </div>
      )}
    </FPPanel>
  );
}
