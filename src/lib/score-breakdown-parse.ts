import type { DealScoreBreakdown, SellerScoreBreakdownStored } from "@/lib/supabase/types";

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const cleaned = v.replace(/[$,\s]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/**
 * Normalizes `score_breakdown` from Supabase / API (JSONB object, JSON string,
 * or legacy snake_case keys) into camelCase dimensions + flag arrays.
 */
export function parseStoredScoreBreakdown(raw: unknown): SellerScoreBreakdownStored {
  let obj: Record<string, unknown> = {};

  if (raw == null) {
    return {
      businessType: 0,
      recurringRevenue: 0,
      marginProfile: 0,
      valuationMultiple: 0,
      aiOpportunity: 0,
      marketSize: 0,
      flags: [],
      redFlags: [],
    };
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      return {
        businessType: 0,
        recurringRevenue: 0,
        marginProfile: 0,
        valuationMultiple: 0,
        aiOpportunity: 0,
        marketSize: 0,
        flags: [],
        redFlags: [],
      };
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return {
      businessType: 0,
      recurringRevenue: 0,
      marginProfile: 0,
      valuationMultiple: 0,
      aiOpportunity: 0,
      marketSize: 0,
      flags: [],
      redFlags: [],
    };
  }

  const breakdown: DealScoreBreakdown = {
    businessType: num(obj.businessType ?? obj.business_type),
    recurringRevenue: num(obj.recurringRevenue ?? obj.recurring_revenue),
    marginProfile: num(obj.marginProfile ?? obj.margin_profile),
    valuationMultiple: num(obj.valuationMultiple ?? obj.valuation_multiple),
    aiOpportunity: num(obj.aiOpportunity ?? obj.ai_opportunity),
    marketSize: num(obj.marketSize ?? obj.market_size),
  };

  return {
    ...breakdown,
    flags: stringArray(obj.flags),
    redFlags: stringArray(obj.redFlags ?? obj.red_flags),
  };
}
