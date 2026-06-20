import { ConstraintPanel } from "@/features/constraints/ConstraintPanel";
import { useAppStore } from "@/store/useAppStore";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { cn } from "@/utils/cn";

export function StepConstraints() {
  const rankingMode = useAppStore((state) => state.rankingMode);
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const setUsePriorityRanking = useAppStore(
    (state) => state.setUsePriorityRanking
  );

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted">Optional Requirements</h2>
        <ConstraintPanel />
      </div>

      <div className="space-y-4 pt-4 border-t border-hairline">
        <h2 className="text-sm font-medium text-muted">Generation Settings</h2>
        <Card className="bg-canvas shadow-none">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Ranking Mode</p>
              </div>
              <Badge>{rankingMode}</Badge>
            </div>
            <Select
              className="mt-4"
              value={rankingMode}
              onChange={(event) => setRankingMode(event.target.value as RankingMode)}
            >
              {getRankingProfiles().map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => setUsePriorityRanking(!usePriorityRanking)}
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-[12px] font-medium leading-tight transition",
                usePriorityRanking
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-hairline bg-canvas text-ink hover:bg-surface-soft"
              )}
            >
              Priority ranking
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  usePriorityRanking ? "bg-primary" : "bg-muted/40"
                )}
              />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
