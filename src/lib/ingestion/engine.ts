import "server-only";

import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/client";
import { scoreBreakdownForStorage, scoreDeal } from "@/lib/deal-scoring";
import type { LeadSource, SellerLead } from "@/lib/supabase/types";
import { fetchFlippaListings } from "@/lib/ingestion/flippa";
import {
  normalizeBusinessTypeLabel,
  normalizeFlippaDeal,
  type NormalizedPipelineLead,
  type PipelineBusinessType,
} from "@/lib/ingestion/normalizer";
import { parseMoneyField } from "@/lib/seller-financials";

export interface IngestionResult {
  source: string;
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  messages: string[];
}

type SellerRecord = Partial<SellerLead> & { id: string };

function buildInsertPayload(normalized: NormalizedPipelineLead): Record<string, unknown> {
  const email = `import-${randomUUID()}@aquira-pipeline.invalid`;
  return {
    locale: "en",
    full_name: "Pipeline import",
    email,
    company_name: normalized.company_name,
    website: normalized.website,
    country: normalized.country,
    business_type: normalized.business_type,
    industry: normalized.industry,
    monthly_revenue: normalized.monthly_revenue,
    monthly_profit: normalized.monthly_profit,
    annual_revenue_optional: normalized.annual_revenue_optional,
    asking_price: normalized.asking_price,
    revenue_range: null,
    asking_price_range: null,
    profitability_status: normalized.profitability_status,
    reason_for_selling: null,
    additional_notes: normalized.additional_notes,
    consent_checkbox: false,
    status: "new",
    deal_source: normalized.deal_source,
    source_url: normalized.source_url,
    source_listing_id: normalized.source_listing_id,
    source_data: normalized.source_data,
    imported_at: normalized.imported_at,
  };
}

async function insertNormalizedLead(
  normalized: NormalizedPipelineLead
): Promise<{ outcome: "imported" | "duplicate" | "error"; sellerId?: string }> {
  if (normalized.source_listing_id) {
    const { data: existing } = await supabaseAdmin
      .from("seller_leads")
      .select("id")
      .eq("deal_source", normalized.deal_source)
      .eq("source_listing_id", normalized.source_listing_id)
      .maybeSingle();
    if (existing) return { outcome: "duplicate" };
  }

  const baseRow = buildInsertPayload(normalized);
  const tempForScore = {
    ...baseRow,
    id: "00000000-0000-0000-0000-000000000001",
  } as unknown as SellerRecord;
  const score = scoreDeal(tempForScore);

  const { data: inserted, error } = await supabaseAdmin
    .from("seller_leads")
    .insert({
      ...baseRow,
      deal_score: score.total,
      score_breakdown: scoreBreakdownForStorage(score),
      deal_stage: score.total >= 75 ? "reviewing" : "new",
      last_scored_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { outcome: "duplicate" };
    console.error("[ingestion] insert error", error);
    return { outcome: "error" };
  }

  const sellerId = inserted?.id as string | undefined;
  if (sellerId) {
    await supabaseAdmin.from("deal_activity_log").insert({
      seller_id: sellerId,
      action: "deal_imported",
      details: {
        deal_source: normalized.deal_source,
        source_listing_id: normalized.source_listing_id,
        score: score.total,
      },
    });
  }

  return { outcome: "imported", sellerId };
}

export async function ingestFromFlippa(options?: {
  types?: string[];
  maxPrice?: number;
  minPrice?: number;
  pages?: number;
}): Promise<IngestionResult> {
  const { listings, errors: fetchErrors } = await fetchFlippaListings({
    types: options?.types,
    maxPrice: options?.maxPrice,
    minPrice: options?.minPrice,
    pages: options?.pages ?? 1,
    pageSize: 50,
  });

  let imported = 0;
  let duplicates = 0;
  let errCount = 0;

  for (const listing of listings) {
    const normalized = normalizeFlippaDeal(listing);
    if (!normalized) {
      errCount++;
      continue;
    }
    const { outcome } = await insertNormalizedLead(normalized);
    if (outcome === "imported") imported++;
    else if (outcome === "duplicate") duplicates++;
    else errCount++;
  }

  return {
    source: "flippa",
    total: listings.length,
    imported,
    duplicates,
    errors: errCount + fetchErrors.length,
    messages: fetchErrors,
  };
}

export async function ingestExternalDeals(
  deals: unknown[],
  source: LeadSource,
  normalizeFn: (deal: Record<string, unknown>) => NormalizedPipelineLead | null
): Promise<IngestionResult> {
  let imported = 0;
  let duplicates = 0;
  let errCount = 0;

  for (const deal of deals) {
    if (!deal || typeof deal !== "object" || Array.isArray(deal)) {
      errCount++;
      continue;
    }
    const normalized = normalizeFn(deal as Record<string, unknown>);
    if (!normalized || normalized.deal_source !== source) {
      errCount++;
      continue;
    }
    const { outcome } = await insertNormalizedLead(normalized);
    if (outcome === "imported") imported++;
    else if (outcome === "duplicate") duplicates++;
    else errCount++;
  }

  return {
    source,
    total: deals.length,
    imported,
    duplicates,
    errors: errCount,
    messages: [],
  };
}

function parseSimpleCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function csvRowToNormalized(row: Record<string, string>): NormalizedPipelineLead | null {
  const company =
    row.company_name || row.company || row["company name"] || row.title || row.name || "";
  if (!company.trim()) return null;
  const mrev = parseMoneyField(row.monthly_revenue || row.mrr || row.revenue);
  const ask = parseMoneyField(row.asking_price || row.asking || row.price);
  const mprof = parseMoneyField(row.monthly_profit || row.profit);
  return {
    company_name: company.slice(0, 500),
    business_type: normalizeBusinessTypeLabel(row.business_type || row.type || ""),
    monthly_revenue: mrev,
    monthly_profit: mprof,
    annual_revenue_optional: mrev != null && mrev > 0 ? mrev * 12 : null,
    asking_price: ask,
    country: (row.country || "Unknown").slice(0, 120),
    website: row.url || row.website || null,
    industry: row.industry || null,
    additional_notes: row.notes || row.description || null,
    profitability_status:
      mrev != null && mrev > 0 && mprof != null && mprof > 0
        ? "profitable"
        : null,
    deal_source: "manual",
    source_url: row.url || row.website || null,
    source_listing_id: randomUUID(),
    source_data: { csv_row: row },
    imported_at: new Date().toISOString(),
  };
}

export async function ingestCsvText(csvText: string): Promise<IngestionResult> {
  const table = parseSimpleCsv(csvText);
  let imported = 0;
  let duplicates = 0;
  let errCount = 0;
  for (const row of table) {
    const normalized = csvRowToNormalized(row);
    if (!normalized) {
      errCount++;
      continue;
    }
    const { outcome } = await insertNormalizedLead(normalized);
    if (outcome === "imported") imported++;
    else if (outcome === "duplicate") duplicates++;
    else errCount++;
  }
  return {
    source: "manual",
    total: table.length,
    imported,
    duplicates,
    errors: errCount,
    messages: [],
  };
}

export async function ingestManualLead(input: {
  company_name: string;
  business_type: PipelineBusinessType;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  asking_price: number | null;
  country: string;
  website: string | null;
  industry: string | null;
  additional_notes: string | null;
  profitability_status: NormalizedPipelineLead["profitability_status"];
  manual_origin?: string | null;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const source_listing_id = randomUUID();
  const notes = [input.additional_notes, input.manual_origin ? `Origin: ${input.manual_origin}` : null]
    .filter(Boolean)
    .join("\n\n");

  const normalized: NormalizedPipelineLead = {
    company_name: input.company_name,
    business_type: input.business_type,
    monthly_revenue: input.monthly_revenue,
    monthly_profit: input.monthly_profit,
    annual_revenue_optional:
      input.monthly_revenue != null && input.monthly_revenue > 0 ? input.monthly_revenue * 12 : null,
    asking_price: input.asking_price,
    country: input.country,
    website: input.website,
    industry: input.industry,
    additional_notes: notes || null,
    profitability_status: input.profitability_status,
    deal_source: "manual",
    source_url: input.website,
    source_listing_id,
    source_data: { manual_origin: input.manual_origin ?? null },
    imported_at: new Date().toISOString(),
  };

  const { outcome, sellerId } = await insertNormalizedLead(normalized);
  if (outcome !== "imported") {
    return { ok: false, error: outcome === "duplicate" ? "Duplicate" : "Insert failed" };
  }

  return { ok: true, id: sellerId };
}
