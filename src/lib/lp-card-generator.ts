import type { DealScoreBreakdown, SellerLead } from "@/lib/supabase/types";
import { estimateAnnualRevenue, estimateAskingPrice, estimateMonthlyRevenue } from "@/lib/seller-financials";

export type DealScoreForCard = {
  total: number;
  breakdown: DealScoreBreakdown;
  flags: string[];
  redFlags: string[];
};

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
  breakdown: DealScoreBreakdown;
  thesisAlignment: string[];
  aiLatamOpportunity: string;
  confidentialityNotice: string;
}

function formatDealId(createdAt: string, sellerId: string): string {
  const year = new Date(createdAt).getFullYear();
  const short = sellerId.replaceAll("-", "").slice(0, 3).toUpperCase();
  return `AQ-${year}-${short}`;
}

export function buildLpDealCardData(
  seller: Partial<SellerLead> & { id: string; created_at: string },
  score: DealScoreForCard
): LpDealCardData {
  const monthlyRevenue = estimateMonthlyRevenue(seller);
  const monthlyProfit =
    seller.monthly_profit && seller.monthly_profit > 0 ? Number(seller.monthly_profit) : null;
  const askingPrice = estimateAskingPrice(seller);
  const annualRevenue = estimateAnnualRevenue(seller);
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
