/**
 * Shared parsing + range estimates for seller leads (scoring + pipeline UI).
 * No server-only guard — safe to import from client components.
 */

export type SellerFinancialFields = {
  monthly_revenue?: unknown;
  annual_revenue_optional?: unknown;
  asking_price?: unknown;
  revenue_range?: string | null;
  asking_price_range?: string | null;
  monthly_profit?: unknown;
};

export function parseMoneyField(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    if (cleaned === "") return null;
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

export function coercePositiveNumber(value: unknown): number | null {
  const n = parseMoneyField(value);
  return n != null && n > 0 ? n : null;
}

export function normalizeSlug(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

/** Midpoint monthly revenue from range slug (matches deal-scoring logic). */
export function monthlyRevenueFromRangeSlug(range: string | null | undefined): number | null {
  const r = normalizeSlug(range);
  if (r === "50k_plus") return 50000;
  if (r === "20k_50k") return 20000;
  if (r === "5k_20k") return 5000;
  if (r === "under_5k") return 1000;
  if (r === "pre_revenue") return 0;
  return null;
}

/** Midpoint asking from range slug (matches deal-scoring logic). */
export function askingFromRangeSlug(range: string | null | undefined): number | null {
  const r = normalizeSlug(range);
  if (r === "1m_plus") return 1000000;
  if (r === "500k_1m") return 500000;
  if (r === "250k_500k") return 250000;
  if (r === "100k_250k") return 100000;
  if (r === "under_100k") return 50000;
  return null;
}

export function estimateMonthlyRevenue(lead: SellerFinancialFields): number | null {
  const direct = coercePositiveNumber(lead.monthly_revenue);
  if (direct != null) return direct;
  return monthlyRevenueFromRangeSlug(lead.revenue_range);
}

export function estimateAskingPrice(lead: SellerFinancialFields): number | null {
  const direct = coercePositiveNumber(lead.asking_price);
  if (direct != null) return direct;
  return askingFromRangeSlug(lead.asking_price_range);
}

/**
 * Annual revenue for valuation / summaries: explicit annual, else monthly*12 from
 * numeric or range-derived monthly (treats 0 monthly as no revenue signal → null).
 */
export function estimateAnnualRevenue(lead: SellerFinancialFields): number | null {
  const annualOpt = coercePositiveNumber(lead.annual_revenue_optional);
  if (annualOpt != null) return annualOpt;
  const monthly = estimateMonthlyRevenue(lead);
  if (monthly != null && monthly > 0) return monthly * 12;
  return null;
}

/** Annual profit estimate from monthly_profit when present. */
export function estimateAnnualProfit(lead: SellerFinancialFields): number | null {
  const mp = coercePositiveNumber(lead.monthly_profit);
  return mp != null ? mp * 12 : null;
}
