import { estimateAnnualRevenue, estimateAskingPrice } from "@/lib/seller-financials";
import type { SellerLead } from "@/lib/supabase/types";

function toNumber(value: number | null | undefined): number {
  return typeof value === "number" ? value : 0;
}

export interface PipelineStatsComputed {
  totalDeals: number;
  shortlisted: number;
  lpReady: number;
  avgScore: number;
  topSectors: Array<{ sector: string; count: number }>;
  averageAsking: number;
  averageMultiple: number;
  pipelineValue: number;
}

export function computePipelineStats(sellers: SellerLead[]): PipelineStatsComputed {
  const totalDeals = sellers.length;
  const shortlisted = sellers.filter((s) => s.deal_stage === "shortlisted").length;
  const lpReady = sellers.filter((s) => s.deal_stage === "lp_ready").length;
  const avgScore =
    totalDeals > 0 ? sellers.reduce((sum, s) => sum + toNumber(s.deal_score), 0) / totalDeals : 0;

  const sectorMap = new Map<string, number>();
  for (const seller of sellers) {
    const sector = (seller.business_type || "other").toLowerCase();
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);
  }
  const topSectors = [...sectorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, count]) => ({ sector, count }));

  const askingValues = sellers.map((s) => estimateAskingPrice(s) ?? 0);
  const revenueValues = sellers.map((s) => estimateAnnualRevenue(s) ?? 0);
  const averageAsking =
    askingValues.length > 0 ? askingValues.reduce((sum, value) => sum + value, 0) / askingValues.length : 0;
  const multipleValues = sellers
    .map((s, idx) => {
      const rev = revenueValues[idx];
      const ask = askingValues[idx];
      if (!rev || rev <= 0 || !ask) return 0;
      return ask / rev;
    })
    .filter((x) => x > 0);
  const averageMultiple =
    multipleValues.length > 0
      ? multipleValues.reduce((sum, value) => sum + value, 0) / multipleValues.length
      : 0;
  const pipelineValue = sellers
    .filter((s) => s.deal_stage === "shortlisted")
    .reduce((sum, s) => sum + (estimateAskingPrice(s) ?? 0), 0);

  return {
    totalDeals,
    shortlisted,
    lpReady,
    avgScore,
    topSectors,
    averageAsking,
    averageMultiple,
    pipelineValue,
  };
}

export function countByDealSource(sellers: SellerLead[]): Record<string, number> {
  return sellers.reduce<Record<string, number>>((acc, s) => {
    const key = s.deal_source ?? "organic";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
