import type { DealScore } from "@/lib/deal-scoring";
import type { SellerLead } from "@/lib/supabase/types";

export interface LpDealCardData {
  dealId: string;
  generatedAt: string;
  businessType: string;
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  profitMargin: number | null;
  askingPrice: number | null;
  impliedMultiple: number | null;
  stage: string;
  thesisScore: number;
  breakdown: DealScore["breakdown"];
  thesisAlignment: string[];
  aiLatamOpportunity: string;
  confidentialityNotice: string;
}

function estimateRevenueFromRange(range: string | null | undefined): number | null {
  const key = (range ?? "").toLowerCase();
  if (key === "50k_plus") return 50000;
  if (key === "20k_50k") return 20000;
  if (key === "5k_20k") return 5000;
  if (key === "under_5k") return 1000;
  if (key === "pre_revenue") return 0;
  return null;
}

function estimateAskingFromRange(range: string | null | undefined): number | null {
  const key = (range ?? "").toLowerCase();
  if (key === "1m_plus") return 1000000;
  if (key === "500k_1m") return 500000;
  if (key === "250k_500k") return 250000;
  if (key === "100k_250k") return 100000;
  if (key === "under_100k") return 50000;
  return null;
}

function formatDealId(createdAt: string, sellerId: string): string {
  const year = new Date(createdAt).getFullYear();
  const short = sellerId.replaceAll("-", "").slice(0, 3).toUpperCase();
  return `AQ-${year}-${short}`;
}

export function buildLpDealCardData(
  seller: Partial<SellerLead> & { id: string; created_at: string },
  score: DealScore
): LpDealCardData {
  const monthlyRevenue =
    seller.monthly_revenue && seller.monthly_revenue > 0
      ? Number(seller.monthly_revenue)
      : estimateRevenueFromRange(seller.revenue_range);
  const monthlyProfit =
    seller.monthly_profit && seller.monthly_profit > 0 ? Number(seller.monthly_profit) : null;
  const askingPrice =
    seller.asking_price && seller.asking_price > 0
      ? Number(seller.asking_price)
      : estimateAskingFromRange(seller.asking_price_range);
  const annualRevenue = monthlyRevenue ? monthlyRevenue * 12 : null;
  const impliedMultiple =
    askingPrice && annualRevenue && annualRevenue > 0 ? askingPrice / annualRevenue : null;
  const profitMargin =
    monthlyProfit && monthlyRevenue && monthlyRevenue > 0
      ? Math.round((monthlyProfit / monthlyRevenue) * 100)
      : null;

  return {
    dealId: formatDealId(seller.created_at, seller.id),
    generatedAt: new Date().toISOString(),
    businessType:
      seller.business_type && seller.industry
        ? `${seller.business_type} — ${seller.industry}`
        : seller.business_type || seller.industry || "Unknown",
    monthlyRevenue,
    monthlyProfit,
    profitMargin,
    askingPrice,
    impliedMultiple,
    stage: seller.deal_stage || "new",
    thesisScore: score.total,
    breakdown: score.breakdown,
    thesisAlignment: score.flags.slice(0, 3),
    aiLatamOpportunity:
      "AI enablement can improve support, content operations, and back-office execution with LATAM operators.",
    confidentialityNotice:
      "This deal summary is shared under NDA. Company identity disclosed upon LP commitment.",
  };
}
