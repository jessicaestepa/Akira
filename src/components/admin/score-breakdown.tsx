import type { DealScoreBreakdown } from "@/lib/supabase/types";

const DIMENSION_KEYS = [
  "businessType",
  "recurringRevenue",
  "marginProfile",
  "valuationMultiple",
  "aiOpportunity",
  "marketSize",
] as const satisfies readonly (keyof DealScoreBreakdown)[];

const MAX: Record<(typeof DIMENSION_KEYS)[number], number> = {
  businessType: 25,
  recurringRevenue: 20,
  marginProfile: 15,
  valuationMultiple: 15,
  aiOpportunity: 15,
  marketSize: 10,
};

const LABELS: Record<(typeof DIMENSION_KEYS)[number], string> = {
  businessType: "Business Type",
  recurringRevenue: "Recurring Revenue",
  marginProfile: "Margin Profile",
  valuationMultiple: "Valuation Multiple",
  aiOpportunity: "AI Opportunity",
  marketSize: "Market Size",
};

function barFillClass(pct: number): string {
  if (pct >= 60) return "bg-emerald-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-500";
}

function totalScoreClass(total: number): string {
  if (total >= 70) return "text-emerald-600";
  if (total >= 40) return "text-amber-600";
  return "text-red-500";
}

interface Props {
  breakdown: DealScoreBreakdown;
  /** When omitted, sum of dimensions is shown as the total (max 100). */
  headlineTotal?: number;
}

export function ScoreBreakdown({ breakdown, headlineTotal }: Props) {
  const summed = DIMENSION_KEYS.reduce((acc, key) => acc + (breakdown[key] ?? 0), 0);
  const displayTotal = headlineTotal ?? summed;

  return (
    <div className="space-y-3">
      {DIMENSION_KEYS.map((key) => {
        const value = breakdown[key] ?? 0;
        const max = MAX[key];
        const pct = max > 0 ? Math.round((value / max) * 100) : 0;
        const width = Math.max(0, Math.min(100, pct));
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{LABELS[key]}</span>
              <span className="font-medium">
                {value}/{max}
              </span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div
                className={`h-2 rounded transition-all ${barFillClass(pct)}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-muted-foreground">Total</span>
          <span className={totalScoreClass(displayTotal)}>
            {displayTotal}/100
          </span>
        </div>
      </div>
    </div>
  );
}
