"use server";

import { sellerSchema } from "@/lib/schemas/seller";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getResend, notificationEmail } from "@/lib/email/resend";
import { sellerEmailHtml } from "@/lib/email/templates";

export async function submitSellerForm(formData: FormData) {
  const raw = {
    locale: formData.get("locale"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    company_name: formData.get("company_name"),
    website: formData.get("website") || undefined,
    country: formData.get("country"),
    business_type: formData.get("business_type"),
    industry: formData.get("industry") || undefined,
    revenue_range: formData.get("revenue_range"),
    profitability_status: formData.get("profitability_status") || undefined,
    asking_price_range: formData.get("asking_price_range") || undefined,
    reason_for_selling: formData.get("reason_for_selling") || undefined,
    additional_notes: formData.get("additional_notes") || undefined,
    consent_checkbox: formData.get("consent_checkbox") === "on",
  };

  const result = sellerSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: "Validation failed. Please check your inputs." };
  }

  const { error } = await supabaseAdmin
    .from("seller_leads")
    .insert(result.data);

  if (error) {
    console.error("Seller insert error:", error);
    return { success: false, error: "Failed to submit. Please try again." };
  }

  try {
    const resend = getResend();
    if (resend && notificationEmail) {
      await resend.emails.send({
        from: "Akira <onboarding@resend.dev>",
        to: notificationEmail,
        subject: "New seller submission - Akira",
        html: sellerEmailHtml(result.data),
      });
    }
  } catch (emailError) {
    console.error("Seller notification email error:", emailError);
  }

  return { success: true };
}
