import type { LeadSource } from "@/lib/supabase/types";
import { flippaListingId, flippaNumeric, type FlippaListingRaw } from "@/lib/ingestion/flippa";
import { parseMoneyField } from "@/lib/seller-financials";

/** Values accepted on seller_leads.business_type (matches public form + pipeline). */
export type PipelineBusinessType =
  | "saas"
  | "ecommerce"
  | "agency"
  | "marketplace"
  | "fintech"
  | "healthtech"
  | "edtech"
  | "app"
  | "content"
  | "other";

export interface NormalizedPipelineLead {
  company_name: string;
  business_type: PipelineBusinessType;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  annual_revenue_optional: number | null;
  asking_price: number | null;
  country: string;
  website: string | null;
  industry: string | null;
  additional_notes: string | null;
  profitability_status: "profitable" | "break_even" | "not_profitable" | null;
  deal_source: LeadSource;
  source_url: string | null;
  source_listing_id: string | null;
  source_data: Record<string, unknown>;
  imported_at: string;
}

export function normalizeBusinessTypeLabel(raw: string | null | undefined): PipelineBusinessType {
  const type = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!type) return "other";
  if (type.includes("saas") || type.includes("software")) return "saas";
  if (type.includes("marketplace") || type.includes("platform")) return "marketplace";
  if (type.includes("fintech")) return "fintech";
  if (type.includes("health")) return "healthtech";
  if (type.includes("edtech") || type.includes("education")) return "edtech";
  if (type === "app" || type.includes("mobile app")) return "app";
  if (type.includes("content") || type.includes("blog") || type.includes("media") || type.includes("newsletter"))
    return "content";
  if (type.includes("ecommerce") || type.includes("e-commerce") || type.includes("shopify") || type.includes("store"))
    return "ecommerce";
  if (type.includes("service") || type.includes("agency") || type.includes("consulting")) return "agency";
  if (type.includes("website") || type.includes("domain")) return "agency";
  return "other";
}

function inferProfitability(mrr: number | null, mprofit: number | null): NormalizedPipelineLead["profitability_status"] {
  if (mrr != null && mrr > 0 && mprofit != null && mprofit > 0) return "profitable";
  if (mprofit != null && mprofit < 0) return "not_profitable";
  if (mprofit != null && mprofit === 0) return "break_even";
  return null;
}

export function normalizeFlippaDeal(listing: FlippaListingRaw): NormalizedPipelineLead | null {
  const id = flippaListingId(listing);
  if (!id) return null;

  const monthlyRevenue =
    flippaNumeric(listing, "average_monthly_revenue", "averageMonthlyRevenue", "revenue", "monthly_revenue") ?? null;
  const monthlyProfit =
    flippaNumeric(
      listing,
      "average_monthly_net_profit",
      "averageMonthlyNetProfit",
      "net_profit",
      "monthly_profit"
    ) ?? null;
  const asking =
    flippaNumeric(listing, "asking_price", "askingPrice", "price", "sale_price", "current_price") ?? null;

  const rawType = String(
    listing.property_type ?? listing.propertyType ?? listing.type ?? listing.category ?? ""
  ).toLowerCase();

  const title = String(listing.title ?? listing.name ?? `Flippa ${id}`).slice(0, 500);
  const summary = String(listing.summary ?? listing.description ?? "").slice(0, 8000);
  const url =
    typeof listing.url === "string"
      ? listing.url
      : typeof listing.listing_url === "string"
        ? listing.listing_url
        : `https://flippa.com/${id}`;

  return {
    company_name: title,
    business_type: normalizeBusinessTypeLabel(rawType),
    monthly_revenue: monthlyRevenue,
    monthly_profit: monthlyProfit,
    annual_revenue_optional:
      monthlyRevenue != null && monthlyRevenue > 0 ? monthlyRevenue * 12 : null,
    asking_price: asking,
    country: String(listing.country ?? listing.location ?? "Unknown").slice(0, 120),
    website: typeof listing.website === "string" ? listing.website : null,
    industry: typeof listing.industry === "string" ? listing.industry : typeof listing.niche === "string" ? listing.niche : null,
    additional_notes: summary || null,
    profitability_status: inferProfitability(monthlyRevenue, monthlyProfit),
    deal_source: "flippa",
    source_url: url,
    source_listing_id: id,
    source_data: listing,
    imported_at: new Date().toISOString(),
  };
}

export function normalizeAcquireDeal(listing: Record<string, unknown>): NormalizedPipelineLead | null {
  const id = listing.id ?? listing.listingId;
  if (id == null) return null;
  const monthlyRevenue =
    parseMoneyField(listing.monthlyRevenue) ??
    (parseMoneyField(listing.arr) != null ? (parseMoneyField(listing.arr)! / 12) : null);
  const monthlyProfit =
    parseMoneyField(listing.netProfitMonthly) ?? parseMoneyField(listing.monthlyProfit);
  const asking = parseMoneyField(listing.askingPrice) ?? parseMoneyField(listing.price);

  return {
    company_name: String(listing.title ?? listing.name ?? `Acquire ${id}`).slice(0, 500),
    business_type: normalizeBusinessTypeLabel(String(listing.type ?? listing.category ?? "")),
    monthly_revenue: monthlyRevenue,
    monthly_profit: monthlyProfit,
    annual_revenue_optional: parseMoneyField(listing.arr) ?? (monthlyRevenue ? monthlyRevenue * 12 : null),
    asking_price: asking,
    country: String(listing.country ?? listing.location ?? "Unknown").slice(0, 120),
    website: typeof listing.url === "string" ? listing.url : typeof listing.listing_url === "string" ? listing.listing_url : null,
    industry: typeof listing.industry === "string" ? listing.industry : null,
    additional_notes:
      typeof listing.description === "string"
        ? listing.description.slice(0, 8000)
        : typeof listing.summary === "string"
          ? listing.summary.slice(0, 8000)
          : null,
    profitability_status: inferProfitability(monthlyRevenue, monthlyProfit),
    deal_source: "acquire",
    source_url:
      typeof listing.url === "string"
        ? listing.url
        : typeof listing.listing_url === "string"
          ? listing.listing_url
          : null,
    source_listing_id: String(id),
    source_data: listing,
    imported_at: new Date().toISOString(),
  };
}

export function normalizeEmpireFlippersDeal(listing: Record<string, unknown>): NormalizedPipelineLead | null {
  const id = listing.id ?? listing.listing_id;
  if (id == null) return null;
  const monthlyProfit = parseMoneyField(listing.monthlyNetProfit) ?? parseMoneyField(listing.monthly_profit);
  const annualRev = parseMoneyField(listing.annualRevenue);
  const monthlyRevenue = annualRev != null && annualRev > 0 ? annualRev / 12 : null;

  return {
    company_name: String(listing.title ?? listing.name ?? `Empire Flippers ${id}`).slice(0, 500),
    business_type: normalizeBusinessTypeLabel(String(listing.monetization ?? listing.type ?? "")),
    monthly_revenue: monthlyRevenue,
    monthly_profit: monthlyProfit,
    annual_revenue_optional: annualRev,
    asking_price: parseMoneyField(listing.listingPrice) ?? parseMoneyField(listing.price),
    country: String(listing.country ?? "Unknown").slice(0, 120),
    website: typeof listing.url === "string" ? listing.url : null,
    industry: typeof listing.niche === "string" ? listing.niche : typeof listing.industry === "string" ? listing.industry : null,
    additional_notes:
      typeof listing.description === "string" ? listing.description.slice(0, 8000) : null,
    profitability_status: inferProfitability(monthlyRevenue, monthlyProfit),
    deal_source: "empire_flippers",
    source_url: typeof listing.url === "string" ? listing.url : null,
    source_listing_id: String(id),
    source_data: listing,
    imported_at: new Date().toISOString(),
  };
}

export function normalizeBizBuySellDeal(listing: Record<string, unknown>): NormalizedPipelineLead | null {
  const id = listing.id ?? listing.listingId;
  if (id == null) return null;
  const annual = parseMoneyField(listing.grossRevenue) ?? parseMoneyField(listing.revenue);
  const cash = parseMoneyField(listing.cashFlow);

  return {
    company_name: String(listing.title ?? listing.name ?? `BizBuySell ${id}`).slice(0, 500),
    business_type: normalizeBusinessTypeLabel(String(listing.category ?? listing.type ?? "")),
    monthly_revenue: annual != null && annual > 0 ? annual / 12 : null,
    monthly_profit: cash != null ? cash / 12 : null,
    annual_revenue_optional: annual,
    asking_price: parseMoneyField(listing.askingPrice) ?? parseMoneyField(listing.price),
    country: listing.state ? `US — ${String(listing.state)}` : String(listing.country ?? "US").slice(0, 120),
    website: typeof listing.url === "string" ? listing.url : typeof listing.listing_url === "string" ? listing.listing_url : null,
    industry: typeof listing.category === "string" ? String(listing.category) : null,
    additional_notes:
      typeof listing.description === "string" ? listing.description.slice(0, 8000) : null,
    profitability_status: inferProfitability(annual != null ? annual / 12 : null, cash != null ? cash / 12 : null),
    deal_source: "bizbuysell",
    source_url:
      typeof listing.url === "string"
        ? listing.url
        : typeof listing.listing_url === "string"
          ? listing.listing_url
          : null,
    source_listing_id: String(id),
    source_data: listing,
    imported_at: new Date().toISOString(),
  };
}
