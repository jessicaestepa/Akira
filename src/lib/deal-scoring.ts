import "server-only";

import { supabaseAdmin } from "@/lib/supabase/client";
import type { DealScoreBreakdown, SellerLead, SellerScoreBreakdownStored } from "@/lib/supabase/types";
import {
  estimateAnnualProfit,
  estimateAnnualRevenue,
  estimateAskingPrice,
  estimateMonthlyRevenue,
  normalizeSlug,
  parseMoneyField,
} from "@/lib/seller-financials";

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
  app: 20,
  content: 10,
  other: 3,
};

function normalize(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/** Map free-text or legacy labels to scoring bucket keys. */
export function canonicalBusinessType(raw: string | null | undefined): string {
  const n = normalize(raw);
  const direct: (keyof typeof BUSINESS_TYPE_SCORES)[] = [
    "saas",
    "ecommerce",
    "agency",
    "marketplace",
    "fintech",
    "healthtech",
    "edtech",
    "app",
    "content",
    "other",
  ];
  if (direct.includes(n as keyof typeof BUSINESS_TYPE_SCORES)) return n;
  if (n.includes("marketplace")) return "marketplace";
  if (n.includes("fintech")) return "fintech";
  if (n.includes("health")) return "healthtech";
  if (n.includes("edtech") || n.includes("education")) return "edtech";
  if (n.includes("saas") || n.includes("software")) return "saas";
  if (n === "app" || n.includes("mobile app") || /\bapp\b/.test(n)) return "app";
  if (n.includes("content") || n.includes("blog") || n.includes("media") || n.includes("newsletter"))
    return "content";
  if (n.includes("service") || n.includes("agency") || n.includes("consulting")) return "agency";
  if (n.includes("ecommerce") || n.includes("e-commerce") || n.includes("shopify")) return "ecommerce";
  return "other";
}

function canonicalProfitability(raw: string | null | undefined): string {
  const n = normalizeSlug(raw);
  if (!n) return "";
  if (n === "profitable") return "profitable";
  if (n === "break_even" || n === "breakeven") return "break_even";
  if (n === "not_profitable" || (n.includes("not") && n.includes("profit"))) return "not_profitable";
  return n;
}

/** Merge alternate API/DB field names and coerce numeric strings before scoring. */
function normalizeSellerForScoring(seller: SellerRecord): SellerRecord {
  const r = seller as Record<string, unknown>;
  const pickStr = (...candidates: unknown[]): string | null | undefined => {
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c;
    }
    return undefined;
  };
  const pickNum = (...candidates: unknown[]): number | null | undefined => {
    for (const c of candidates) {
      const n = parseMoneyField(c);
      if (n != null && !Number.isNaN(n)) return n;
    }
    return undefined;
  };

  const netProfitMonthly = pickNum(r.net_profit_monthly, r.netProfitMonthly, r.average_monthly_net_profit);
  const mergedMonthlyProfit =
    pickNum(seller.monthly_profit, r.monthlyProfit, r.monthly_profit, netProfitMonthly) ??
    seller.monthly_profit;

  return {
    ...seller,
    business_type:
      pickStr(seller.business_type, r.businessType, r.type, r.category) ?? seller.business_type,
    monthly_revenue: pickNum(seller.monthly_revenue, r.monthlyRevenue, r.revenue, r.average_monthly_revenue) ?? seller.monthly_revenue,
    annual_revenue_optional:
      pickNum(seller.annual_revenue_optional, r.annualRevenue, r.annual_revenue) ??
      seller.annual_revenue_optional,
    monthly_profit: mergedMonthlyProfit,
    asking_price: pickNum(seller.asking_price, r.askingPrice, r.price, r.sale_price) ?? seller.asking_price,
  };
}

function businessTypeScore(seller: SellerRecord, flags: string[]): number {
  const businessType = canonicalBusinessType(seller.business_type);
  const base = BUSINESS_TYPE_SCORES[businessType] ?? 3;
  if (base >= 20) flags.push("Software aligned");
  if (businessType === "saas") flags.push("SaaS");
  if (businessType === "app") flags.push("App / product");
  if (businessType === "marketplace") flags.push("Marketplace/Platform");
  return base;
}

function recurringRevenueScore(seller: SellerRecord, _flags: string[], redFlags: string[]): number {
  const monthly = estimateMonthlyRevenue(seller);
  const strongMrr = monthly !== null && monthly >= 5000;

  if (!strongMrr) {
    if (monthly !== null && monthly > 0 && monthly < 5000) {
      redFlags.push("Low revenue (<$5K/mo)");
    } else if (monthly === null) {
      redFlags.push("Revenue not specified");
    } else if (monthly !== null && monthly <= 0) {
      redFlags.push("Pre-revenue or no MRR signal");
    }
    return 3;
  }

  const businessType = canonicalBusinessType(seller.business_type);
  const recurringFriendly = ["saas", "fintech", "healthtech", "edtech", "marketplace", "app"];
  const maybeRecurring = ["agency", "ecommerce", "content"];
  if (recurringFriendly.includes(businessType)) return 15;
  if (maybeRecurring.includes(businessType)) {
    redFlags.push("Recurring revenue unclear");
    return 10;
  }
  redFlags.push("No recurring revenue signal");
  return 3;
}

function marginProfileScore(seller: SellerRecord, flags: string[], redFlags: string[]): number {
  const profitability = canonicalProfitability(seller.profitability_status);
  if (!profitability) {
    return 0;
  }
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
  const asking = estimateAskingPrice(seller);
  const annualRevenue = estimateAnnualRevenue(seller);
  const annualProfit = estimateAnnualProfit(seller);

  if (!asking) return 5;

  const base =
    annualRevenue && annualRevenue > 0
      ? annualRevenue
      : annualProfit && annualProfit > 0
        ? annualProfit
        : null;

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
  redFlags.push(`High multiple (${multiple.toFixed(1)}x)`);
  redFlags.push("Above thesis range");
  return 3;
}

function aiOpportunityScore(seller: SellerRecord, flags: string[]): number {
  const text = `${normalize(seller.additional_notes)} ${normalize(seller.reason_for_selling)} ${normalize(
    seller.industry
  )}`.toLowerCase();
  const businessType = canonicalBusinessType(seller.business_type);

  let score = 0;
  if (/(content|editorial|media|blog|newsletter|seo|copy)/.test(text)) score += 5;
  if (/(support|customer success|help desk|ticket)/.test(text)) score += 4;
  if (/(manual|operations|backoffice|data entry|spreadsheet)/.test(text)) score += 4;
  if (/(us|united states|europe|eu|global|remote team)/.test(text)) score += 6;
  if (["saas", "fintech", "healthtech", "edtech", "marketplace", "app"].includes(businessType)) score += 3;
  if (score >= 10) flags.push("AI ops upside");
  return Math.min(score, 15);
}

function marketSizeScore(seller: SellerRecord): number {
  const monthlyRevenue = estimateMonthlyRevenue(seller);
  if (monthlyRevenue === null) return 4;
  if (monthlyRevenue > 50000) return 10;
  if (monthlyRevenue >= 10000) return 7;
  if (monthlyRevenue >= 5000) return 4;
  if (monthlyRevenue >= 1000) return 2;
  if (monthlyRevenue > 0) return 2;
  return 2;
}

function sumBreakdown(breakdown: DealScoreBreakdown): number {
  return (
    breakdown.businessType +
    breakdown.recurringRevenue +
    breakdown.marginProfile +
    breakdown.valuationMultiple +
    breakdown.aiOpportunity +
    breakdown.marketSize
  );
}

export function scoreDeal(seller: SellerRecord): DealScore {
  if (process.env.DEAL_SCORING_DEBUG === "1" || process.env.DEAL_SCORING_DEBUG === "true") {
    const r = seller as Record<string, unknown>;
    console.log(
      "=== SCORE DEBUG ===",
      JSON.stringify(
        {
          id: seller.id,
          keys: Object.keys(r),
          business_type: seller.business_type ?? r.type ?? r.category,
          revenue: seller.annual_revenue_optional ?? seller.monthly_revenue ?? r.revenue,
          asking: seller.asking_price ?? r.price ?? r.sale_price,
          profit: seller.monthly_profit ?? r.profit_margin ?? r.margin ?? r.net_profit,
        },
        null,
        2
      )
    );
  }

  const s = normalizeSellerForScoring(seller);

  const flags: string[] = [];
  const redFlags: string[] = [];

  const breakdown: DealScoreBreakdown = {
    businessType: businessTypeScore(s, flags),
    recurringRevenue: recurringRevenueScore(s, flags, redFlags),
    marginProfile: marginProfileScore(s, flags, redFlags),
    valuationMultiple: valuationMultipleScore(s, flags, redFlags),
    aiOpportunity: aiOpportunityScore(s, flags),
    marketSize: marketSizeScore(s),
  };

  const total = Math.max(0, Math.min(100, sumBreakdown(breakdown)));

  return { total, breakdown, flags, redFlags };
}

/** Payload stored in `score_breakdown` JSONB (dimensions + flag strings). */
export function scoreBreakdownForStorage(result: DealScore): SellerScoreBreakdownStored {
  return {
    ...result.breakdown,
    flags: result.flags,
    redFlags: result.redFlags,
  };
}

export async function scoreAllDeals(): Promise<{ updated: number }> {
  const { data, error } = await supabaseAdmin.from("seller_leads").select("*");
  if (error) throw error;
  const sellers = data ?? [];

  for (const seller of sellers) {
    const result = scoreDeal(seller as SellerRecord);
    const nextStage = result.total >= 75 ? "reviewing" : ((seller.deal_stage as string) || "new");
    const storedBreakdown = scoreBreakdownForStorage(result);

    await supabaseAdmin
      .from("seller_leads")
      .update({
        deal_score: result.total,
        score_breakdown: storedBreakdown,
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
        flags: result.flags,
        redFlags: result.redFlags,
        stage: nextStage,
      },
    });
  }

  return { updated: sellers.length };
}
