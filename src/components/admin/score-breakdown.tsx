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

interface Props {
  breakdown: DealScoreBreakdown;
}

export function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="space-y-3">
      {DIMENSION_KEYS.map((key) => {
        const value = breakdown[key] ?? 0;
        const max = MAX[key];
        const width = Math.round((value / max) * 100);
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
                className="h-2 rounded bg-primary transition-all"
                style={{ width: `${Math.max(0, Math.min(100, width))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
