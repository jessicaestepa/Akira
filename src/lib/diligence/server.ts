import "server-only";

import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  DealDiligenceChecklistItem,
  DealDiligenceQuestion,
  DealDiligenceReview,
  DealDiligenceRisk,
} from "@/lib/supabase/types";

const DEFAULT_CHECKLIST = [
  ["Financials", "Revenue and profit evidence reviewed"],
  ["Financials", "Asking price and multiple sanity check"],
  ["Revenue Quality", "Revenue concentration / customer quality assessed"],
  ["Revenue Quality", "Retention, churn, or repeat purchase signal reviewed"],
  ["Operations", "Founder interview completed"],
  ["Operations", "Operational complexity and handoff risk assessed"],
  ["Technology", "Tech stack, dependencies, and maintenance risk reviewed"],
  ["AI + LATAM", "AI automation opportunity assessed"],
  ["AI + LATAM", "LATAM talent leverage assessed"],
  ["Legal", "Ownership / IP / transferability checked"],
  ["Risks", "Material red flags documented"],
  ["Investment Memo", "IC recommendation drafted"],
] as const;

export interface DiligencePayload {
  review: DealDiligenceReview;
  checklist: DealDiligenceChecklistItem[];
  questions: DealDiligenceQuestion[];
  risks: DealDiligenceRisk[];
}

async function loadDiligencePayload(review: DealDiligenceReview): Promise<DiligencePayload> {
  const [{ data: checklist }, { data: questions }, { data: risks }] = await Promise.all([
    supabaseAdmin
      .from("deal_diligence_checklist_items")
      .select("*")
      .eq("review_id", review.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("deal_diligence_questions")
      .select("*")
      .eq("review_id", review.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("deal_diligence_risks")
      .select("*")
      .eq("review_id", review.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    review,
    checklist: (checklist ?? []) as DealDiligenceChecklistItem[],
    questions: (questions ?? []) as DealDiligenceQuestion[],
    risks: (risks ?? []) as DealDiligenceRisk[],
  };
}

export async function getDiligenceBySellerId(
  sellerId: string
): Promise<DiligencePayload | null> {
  const { data: review, error } = await supabaseAdmin
    .from("deal_diligence_reviews")
    .select("*")
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) throw error;
  if (!review) return null;

  return loadDiligencePayload(review as DealDiligenceReview);
}

export async function ensureDiligenceForSeller(sellerId: string): Promise<DiligencePayload> {
  const existing = await getDiligenceBySellerId(sellerId);
  if (existing) return existing;

  const { data: review, error } = await supabaseAdmin
    .from("deal_diligence_reviews")
    .insert({
      seller_id: sellerId,
      status: "in_progress",
      recommendation: "undecided",
    })
    .select("*")
    .single();

  if (error) throw error;
  const createdReview = review as DealDiligenceReview;

  await supabaseAdmin.from("deal_diligence_checklist_items").insert(
    DEFAULT_CHECKLIST.map(([category, label], index) => ({
      review_id: createdReview.id,
      category,
      label,
      status: "not_started",
      sort_order: index,
    }))
  );

  await supabaseAdmin
    .from("seller_leads")
    .update({ deal_stage: "in_due_diligence" })
    .eq("id", sellerId);

  await supabaseAdmin.from("deal_activity_log").insert({
    seller_id: sellerId,
    action: "diligence_started",
    details: { review_id: createdReview.id },
  });

  const payload = await getDiligenceBySellerId(sellerId);
  if (!payload) throw new Error("Failed to load newly-created diligence review");
  return payload;
}
