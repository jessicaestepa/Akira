import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const STAGE_VALUES = new Set(["new", "reviewing", "shortlisted", "lp_ready", "passed"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const auth = cookieStore.get(SESSION_COOKIE_NAME);
  if (!(await verifySessionToken(auth?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const logEntries: Array<{ action: string; details: Record<string, unknown> }> = [];

  if (typeof body.deal_stage === "string" && STAGE_VALUES.has(body.deal_stage)) {
    patch.deal_stage = body.deal_stage;
    logEntries.push({ action: "stage_change", details: { stage: body.deal_stage } });
  }
  if (typeof body.thesis_fit_notes === "string") {
    patch.thesis_fit_notes = body.thesis_fit_notes;
    logEntries.push({ action: "note_added", details: { length: body.thesis_fit_notes.length } });
  }
  if (typeof body.is_starred === "boolean") {
    patch.is_starred = body.is_starred;
    logEntries.push({ action: "starred", details: { value: body.is_starred } });
  }
  if (typeof body.lp_card_generated === "boolean") {
    patch.lp_card_generated = body.lp_card_generated;
    logEntries.push({
      action: "lp_card_generated",
      details: { value: body.lp_card_generated },
    });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("seller_leads").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
  }

  if (logEntries.length > 0) {
    await supabaseAdmin.from("deal_activity_log").insert(
      logEntries.map((entry) => ({
        seller_id: id,
        action: entry.action,
        details: entry.details,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
