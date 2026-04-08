import { NextResponse } from "next/server";
import { sellerSchema } from "@/lib/schemas/seller";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getResend, notificationEmail } from "@/lib/email/resend";
import { sellerEmailHtml } from "@/lib/email/templates";

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

  try {
    const { error: dbError } = await supabaseAdmin
      .from("seller_leads")
      .insert(data);

    if (dbError) {
      console.error("[api/seller] Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to submit. Please try again." },
        { status: 500 }
      );
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

  return NextResponse.json({ success: true }, { status: 201 });
}
