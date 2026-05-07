import "server-only";

import { supabaseAdmin } from "@/lib/supabase/client";
import type { DealScoreBreakdown, SellerLead } from "@/lib/supabase/types";

export interface DealScore {
  total: number;
  breakdown: DealScoreBreakdown;
  flags: string[];
  redFlags: string[];
}

type SellerRecord = Partial<SellerLead> & {
  id: string;
  business_type?: string | null;
  industry?: string | null;
  revenue_range?: string | null;
  profitability_status?: string | null;
  asking_price?: number | null;
  asking_price_range?: string | null;
  monthly_revenue?: number | null;
  monthly_profit?: number | null;
  annual_revenue_optional?: number | null;
  country?: string | null;
  additional_notes?: string | null;
  reason_for_selling?: string | null;
};

const BUSINESS_TYPE_SCORES: Record<string, number> = {
  saas: 25,
  fintech: 25,
  healthtech: 25,
  edtech: 25,
  marketplace: 20,
  ecommerce: 5,
  agency: 8,
  other: 3,
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function monthlyRevenueEstimate(seller: SellerRecord): number | null {
  if (seller.monthly_revenue && seller.monthly_revenue > 0) return Number(seller.monthly_revenue);
  const range = normalize(seller.revenue_range);
  if (range === "50k_plus") return 50000;
  if (range === "20k_50k") return 20000;
  if (range === "5k_20k") return 5000;
  if (range === "under_5k") return 1000;
  if (range === "pre_revenue") return 0;
  return null;
}

function askingPriceEstimate(seller: SellerRecord): number | null {
  if (seller.asking_price && seller.asking_price > 0) return Number(seller.asking_price);
  const range = normalize(seller.asking_price_range);
  if (range === "1m_plus") return 1000000;
  if (range === "500k_1m") return 500000;
  if (range === "250k_500k") return 250000;
  if (range === "100k_250k") return 100000;
  if (range === "under_100k") return 50000;
  return null;
}

function businessTypeScore(seller: SellerRecord, flags: string[]): number {
  const businessType = normalize(seller.business_type);
  const base = BUSINESS_TYPE_SCORES[businessType] ?? 3;
  if (base >= 20) flags.push("Software aligned");
  if (businessType === "saas") flags.push("SaaS");
  return base;
}

function recurringRevenueScore(seller: SellerRecord, flags: string[], redFlags: string[]): number {
  const businessType = normalize(seller.business_type);
  const recurringFriendly = ["saas", "fintech", "healthtech", "edtech", "marketplace"];
  const maybeRecurring = ["agency", "ecommerce"];
  if (recurringFriendly.includes(businessType)) return 15;
  if (maybeRecurring.includes(businessType)) {
    redFlags.push("Recurring revenue unclear");
    return 10;
  }
  redFlags.push("No recurring revenue signal");
  return 3;
}

function marginProfileScore(seller: SellerRecord, flags: string[], redFlags: string[]): number {
  const profitability = normalize(seller.profitability_status);
  if (profitability === "profitable") {
    flags.push("Profitable");
    return 12;
  }
  if (profitability === "break_even") return 8;
  if (profitability === "not_profitable") {
    redFlags.push("Not profitable");
    return 0;
  }
  return 4;
}

function valuationMultipleScore(
  seller: SellerRecord,
  flags: string[],
  redFlags: string[]
): number {
  const asking = askingPriceEstimate(seller);
  const annualRevenue =
    (seller.annual_revenue_optional && seller.annual_revenue_optional > 0
      ? Number(seller.annual_revenue_optional)
      : null) ?? ((monthlyRevenueEstimate(seller) ?? 0) * 12 || null);
  const annualProfit = (seller.monthly_profit ?? 0) > 0 ? Number(seller.monthly_profit) * 12 : null;

  if (!asking) return 5;

  const base = annualRevenue || annualProfit;
  if (!base || base <= 0) return 5;

  const multiple = asking / base;

  if (multiple < 2) {
    flags.push("Below 2x multiple");
    return 15;
  }
  if (multiple < 3) {
    flags.push("Below 3x multiple");
    return 12;
  }
  if (multiple < 4) return 10;
  if (multiple < 5) return 6;
  redFlags.push("High valuation multiple");
  return 3;
}

function aiOpportunityScore(seller: SellerRecord, flags: string[]): number {
  const text = `${normalize(seller.additional_notes)} ${normalize(seller.reason_for_selling)} ${normalize(
    seller.industry
  )}`.toLowerCase();
  const businessType = normalize(seller.business_type);

  let score = 0;
  if (/(content|editorial|media|blog|newsletter|seo|copy)/.test(text)) score += 5;
  if (/(support|customer success|help desk|ticket)/.test(text)) score += 4;
  if (/(manual|operations|backoffice|data entry|spreadsheet)/.test(text)) score += 4;
  if (/(us|united states|europe|eu|global|remote team)/.test(text)) score += 6;
  if (["saas", "fintech", "healthtech", "edtech", "marketplace"].includes(businessType)) score += 3;
  if (score >= 10) flags.push("AI ops upside");
  return Math.min(score, 15);
}

function marketSizeScore(seller: SellerRecord): number {
  const monthlyRevenue = monthlyRevenueEstimate(seller);
  if (monthlyRevenue === null) return 4;
  if (monthlyRevenue > 50000) return 10;
  if (monthlyRevenue >= 10000) return 7;
  if (monthlyRevenue >= 1000) return 4;
  return 2;
}

export function scoreDeal(seller: SellerRecord): DealScore {
  const flags: string[] = [];
  const redFlags: string[] = [];

  const breakdown: DealScoreBreakdown = {
    businessType: businessTypeScore(seller, flags),
    recurringRevenue: recurringRevenueScore(seller, flags, redFlags),
    marginProfile: marginProfileScore(seller, flags, redFlags),
    valuationMultiple: valuationMultipleScore(seller, flags, redFlags),
    aiOpportunity: aiOpportunityScore(seller, flags),
    marketSize: marketSizeScore(seller),
  };

  const total = Math.max(
    0,
    Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0))
  );

  return { total, breakdown, flags, redFlags };
}

export async function scoreAllDeals(): Promise<{ updated: number }> {
  const { data, error } = await supabaseAdmin.from("seller_leads").select("*");
  if (error) throw error;
  const sellers = data ?? [];

  for (const seller of sellers) {
    const result = scoreDeal(seller as SellerRecord);
    const nextStage = result.total >= 75 ? "reviewing" : ((seller.deal_stage as string) || "new");

    await supabaseAdmin
      .from("seller_leads")
      .update({
        deal_score: result.total,
        score_breakdown: result.breakdown,
        last_scored_at: new Date().toISOString(),
        deal_stage: nextStage,
      })
      .eq("id", seller.id);

    await supabaseAdmin.from("deal_activity_log").insert({
      seller_id: seller.id,
      action: "score_update",
      details: {
        total: result.total,
        breakdown: result.breakdown,
        stage: nextStage,
      },
    });
  }

  return { updated: sellers.length };
}
