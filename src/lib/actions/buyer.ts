"use server";

import { buyerSchema } from "@/lib/schemas/buyer";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getResend, notificationEmail } from "@/lib/email/resend";
import { buyerEmailHtml } from "@/lib/email/templates";

export async function submitBuyerForm(formData: FormData) {
  const raw = {
    locale: formData.get("locale"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    firm_name_optional: formData.get("firm_name_optional") || undefined,
    buyer_type: formData.get("buyer_type"),
    website_or_linkedin_optional:
      formData.get("website_or_linkedin_optional") || undefined,
    preferred_geographies: formData.getAll("preferred_geographies"),
    preferred_sectors: formData.getAll("preferred_sectors"),
    check_size_range: formData.get("check_size_range"),
    acquisition_interest: formData.get("acquisition_interest") || undefined,
    additional_notes: formData.get("additional_notes") || undefined,
    consent_checkbox: formData.get("consent_checkbox") === "on",
  };

  const result = buyerSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: "Validation failed. Please check your inputs." };
  }

  const { error } = await supabaseAdmin
    .from("buyer_leads")
    .insert(result.data);

  if (error) {
    console.error("Buyer insert error:", error);
    return { success: false, error: "Failed to submit. Please try again." };
  }

  try {
    const resend = getResend();
    if (resend && notificationEmail) {
      await resend.emails.send({
        from: "Akira <onboarding@resend.dev>",
        to: notificationEmail,
        subject: "New buyer submission - Akira",
        html: buyerEmailHtml(result.data),
      });
    }
  } catch (emailError) {
    console.error("Buyer notification email error:", emailError);
  }

  return { success: true };
}
