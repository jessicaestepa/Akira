import { NextResponse } from "next/server";
import { sellerSchema } from "@/lib/schemas/seller";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getResend, notificationEmail } from "@/lib/email/resend";
import { sellerEmailHtml } from "@/lib/email/templates";
import { scoreDeal } from "@/lib/deal-scoring";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const result = sellerSchema.safeParse(body);

  if (!result.success) {
    console.warn("[api/seller] Validation failed:", result.error.flatten());
    return NextResponse.json(
      { error: "Validation failed. Please check your inputs." },
      { status: 422 }
    );
  }

  const data = result.data;
  let insertedSellerId: string | null = null;

  try {
    const { data: insertedSeller, error: dbError } = await supabaseAdmin
      .from("seller_leads")
      .insert(data)
      .select("*")
      .single();

    if (dbError) {
      console.error("[api/seller] Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to submit. Please try again." },
        { status: 500 }
      );
    }

    if (insertedSeller) {
      insertedSellerId = insertedSeller.id;
      const dealScore = scoreDeal(insertedSeller);
      const nextStage = dealScore.total >= 75 ? "reviewing" : "new";

      const { error: updateError } = await supabaseAdmin
        .from("seller_leads")
        .update({
          deal_score: dealScore.total,
          score_breakdown: dealScore.breakdown,
          deal_stage: nextStage,
          last_scored_at: new Date().toISOString(),
        })
        .eq("id", insertedSeller.id);

      if (updateError) {
        console.error("[api/seller] scoring update error:", updateError);
      } else {
        await supabaseAdmin.from("deal_activity_log").insert({
          seller_id: insertedSeller.id,
          action: "score_update",
          details: {
            total: dealScore.total,
            breakdown: dealScore.breakdown,
            flags: dealScore.flags,
            redFlags: dealScore.redFlags,
            stage: nextStage,
            source: "seller_submission",
          },
        });
      }
    }
  } catch (err) {
    console.error("[api/seller] Unexpected DB error:", err);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }

  try {
    const resend = getResend();
    if (resend && notificationEmail) {
      await resend.emails.send({
        from: "Aqüira <onboarding@resend.dev>",
        to: notificationEmail,
        subject: "New seller submission – Aqüira",
        html: sellerEmailHtml(data),
      });
    }
  } catch (emailErr) {
    console.error("[api/seller] Email notification error:", emailErr);
  }

  return NextResponse.json({ success: true, seller_id: insertedSellerId }, { status: 201 });
}
