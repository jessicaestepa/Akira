import type { BuyerLead, SellerLead } from "@/lib/supabase/types";

export interface MatchResult {
  sellerId: string;
  buyerId: string;
  score: number;
  reasons: string[];
}

type SellerRecord = Partial<SellerLead> & { id: string };
type BuyerRecord = Partial<BuyerLead> & { id: string };

function estimateAskingPrice(seller: SellerRecord): number | null {
  if (seller.asking_price && seller.asking_price > 0) return Number(seller.asking_price);
  const range = (seller.asking_price_range ?? "").toLowerCase();
  if (range === "under_100k") return 50000;
  if (range === "100k_250k") return 175000;
  if (range === "250k_500k") return 375000;
  if (range === "500k_1m") return 750000;
  if (range === "1m_plus") return 1200000;
  return null;
}

function estimateRevenue(seller: SellerRecord): number | null {
  if (seller.monthly_revenue && seller.monthly_revenue > 0) return Number(seller.monthly_revenue);
  const range = (seller.revenue_range ?? "").toLowerCase();
  if (range === "under_5k") return 3000;
  if (range === "5k_20k") return 12000;
  if (range === "20k_50k") return 30000;
  if (range === "50k_plus") return 60000;
  if (range === "pre_revenue") return 0;
  return null;
}

function checkSizeToRange(value: string | null | undefined): [number, number] | null {
  const v = (value ?? "").toLowerCase();
  if (v === "under_100k") return [0, 100000];
  if (v === "100k_250k") return [100000, 250000];
  if (v === "250k_500k") return [250000, 500000];
  if (v === "500k_1m") return [500000, 1000000];
  if (v === "1m_plus") return [1000000, Number.MAX_SAFE_INTEGER];
  return null;
}

export function matchBuyerToSellers(
  buyer: BuyerRecord,
  sellers: SellerRecord[]
): MatchResult[] {
  const buyerSectors = (buyer.preferred_sectors ?? []).map((s) => s.toLowerCase());
  const buyerGeos = (buyer.preferred_geographies ?? []).map((g) => g.toLowerCase());
  const checkRange = checkSizeToRange(buyer.check_size_range ?? null);
  const buyerNotes = `${buyer.acquisition_interest ?? ""} ${buyer.additional_notes ?? ""}`.toLowerCase();

  const matches: MatchResult[] = [];

  for (const seller of sellers) {
    let score = 0;
    const reasons: string[] = [];

    const asking = estimateAskingPrice(seller);
    if (checkRange && asking !== null) {
      if (asking >= checkRange[0] && asking <= checkRange[1]) {
        score += 30;
        reasons.push("Budget match");
      } else if (Math.abs(asking - checkRange[1]) / Math.max(checkRange[1], 1) < 0.2) {
        score += 15;
        reasons.push("Near budget");
      }
    }

    const sellerType = (seller.business_type ?? "").toLowerCase();
    const sellerIndustry = (seller.industry ?? "").toLowerCase();
    if (buyerSectors.some((sector) => sellerType.includes(sector) || sellerIndustry.includes(sector))) {
      score += 25;
      reasons.push("Industry overlap");
    }

    const sellerCountry = (seller.country ?? "").toLowerCase();
    if (buyerGeos.some((geo) => geo === sellerCountry)) {
      score += 20;
      reasons.push("Geography fit");
    }

    const revenue = estimateRevenue(seller);
    const buyerTargetRevenue = (buyer.target_revenue_range ?? "").toLowerCase();
    if (revenue !== null) {
      if (revenue >= 50000 && buyerTargetRevenue.includes("50")) score += 15;
      else if (revenue >= 10000 && buyerTargetRevenue.includes("20")) score += 12;
      else if (revenue >= 5000 && buyerTargetRevenue.includes("5")) score += 10;
      else if (!buyerTargetRevenue) score += 8;
      if (score > 0) reasons.push("Size fit");
    }

    const sellerNarrative =
      `${seller.reason_for_selling ?? ""} ${seller.additional_notes ?? ""} ${seller.industry ?? ""}`.toLowerCase();
    const motivationKeywords = ["saas", "ai", "automation", "b2b", "latam", "platform"];
    const overlapCount = motivationKeywords.filter(
      (kw) => buyerNotes.includes(kw) && sellerNarrative.includes(kw)
    ).length;
    if (overlapCount > 0) {
      score += Math.min(10, overlapCount * 3);
      reasons.push("Motivation alignment");
    }

    if (score >= 40) {
      matches.push({
        sellerId: seller.id,
        buyerId: buyer.id,
        score: Math.min(100, score),
        reasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
