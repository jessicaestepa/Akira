import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { ensureDiligenceForSeller, getDiligenceBySellerId } from "@/lib/diligence/server";
import { supabaseAdmin } from "@/lib/supabase/client";

const REVIEW_STATUSES = new Set(["in_progress", "blocked", "complete"]);
const RECOMMENDATIONS = new Set(["undecided", "continue", "pass", "lp_ready"]);
const CHECKLIST_STATUSES = new Set([
  "not_started",
  "in_progress",
  "needs_followup",
  "cleared",
  "blocked",
]);
const QUESTION_STATUSES = new Set(["open", "answered", "closed"]);
const RISK_LEVELS = new Set(["low", "medium", "high"]);
const RISK_STATUSES = new Set(["open", "mitigated", "accepted"]);

async function requirePayload(sellerId: string) {
  const payload = await getDiligenceBySellerId(sellerId);
  if (!payload) {
    return ensureDiligenceForSeller(sellerId);
  }
  return payload;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;
  const payload = await ensureDiligenceForSeller(sellerId);
  return NextResponse.json(payload);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = await requirePayload(sellerId);
  const reviewId = payload.review.id;

  if (body.action === "review_update") {
    const patch: Record<string, unknown> = {};
    if (typeof body.status === "string" && REVIEW_STATUSES.has(body.status)) {
      patch.status = body.status;
    }
    if (typeof body.recommendation === "string" && RECOMMENDATIONS.has(body.recommendation)) {
      patch.recommendation = body.recommendation;
    }
    if (typeof body.executive_summary === "string") {
      patch.executive_summary = body.executive_summary;
    }
    if (typeof body.primary_risk === "string") {
      patch.primary_risk = body.primary_risk;
    }
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin.from("deal_diligence_reviews").update(patch).eq("id", reviewId);
      await supabaseAdmin.from("deal_activity_log").insert({
        seller_id: sellerId,
        action: "diligence_updated",
        details: { kind: "review", patch },
      });
    }
  }

  if (body.action === "checklist_update") {
    const patch: Record<string, unknown> = {};
    if (typeof body.status === "string" && CHECKLIST_STATUSES.has(body.status)) {
      patch.status = body.status;
    }
    if (typeof body.notes === "string") {
      patch.notes = body.notes;
    }
    if (typeof body.item_id === "string" && Object.keys(patch).length > 0) {
      await supabaseAdmin
        .from("deal_diligence_checklist_items")
        .update(patch)
        .eq("id", body.item_id)
        .eq("review_id", reviewId);
    }
  }

  if (body.action === "question_create" && typeof body.question === "string") {
    await supabaseAdmin.from("deal_diligence_questions").insert({
      review_id: reviewId,
      question: body.question,
      owner: typeof body.owner === "string" ? body.owner : null,
      status: "open",
    });
  }

  if (body.action === "question_update" && typeof body.question_id === "string") {
    const patch: Record<string, unknown> = {};
    if (typeof body.answer === "string") patch.answer = body.answer;
    if (typeof body.status === "string" && QUESTION_STATUSES.has(body.status)) {
      patch.status = body.status;
    }
    if (typeof body.owner === "string") patch.owner = body.owner;
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin
        .from("deal_diligence_questions")
        .update(patch)
        .eq("id", body.question_id)
        .eq("review_id", reviewId);
    }
  }

  if (body.action === "risk_create" && typeof body.title === "string") {
    await supabaseAdmin.from("deal_diligence_risks").insert({
      review_id: reviewId,
      title: body.title,
      severity: typeof body.severity === "string" && RISK_LEVELS.has(body.severity) ? body.severity : "medium",
      probability:
        typeof body.probability === "string" && RISK_LEVELS.has(body.probability)
          ? body.probability
          : "medium",
      mitigation: typeof body.mitigation === "string" ? body.mitigation : null,
      decision_impact:
        typeof body.decision_impact === "string" ? body.decision_impact : null,
      status: "open",
    });
  }

  if (body.action === "risk_update" && typeof body.risk_id === "string") {
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.severity === "string" && RISK_LEVELS.has(body.severity)) {
      patch.severity = body.severity;
    }
    if (typeof body.probability === "string" && RISK_LEVELS.has(body.probability)) {
      patch.probability = body.probability;
    }
    if (typeof body.mitigation === "string") patch.mitigation = body.mitigation;
    if (typeof body.decision_impact === "string") {
      patch.decision_impact = body.decision_impact;
    }
    if (typeof body.status === "string" && RISK_STATUSES.has(body.status)) {
      patch.status = body.status;
    }
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin
        .from("deal_diligence_risks")
        .update(patch)
        .eq("id", body.risk_id)
        .eq("review_id", reviewId);
    }
  }

  const next = await getDiligenceBySellerId(sellerId);
  return NextResponse.json(next);
}
