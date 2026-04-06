import { z } from "zod/v4";

export const sellerSchema = z.object({
  locale: z.string(),
  full_name: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  company_name: z.string().min(1, "Required"),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().min(1, "Required"),
  business_type: z.string().min(1, "Required"),
  industry: z.string().optional().or(z.literal("")),
  revenue_range: z.string().min(1, "Required"),
  profitability_status: z.string().optional().or(z.literal("")),
  asking_price_range: z.string().optional().or(z.literal("")),
  reason_for_selling: z.string().optional().or(z.literal("")),
  additional_notes: z.string().optional().or(z.literal("")),
  consent_checkbox: z.literal(true, {
    error: "You must consent to continue",
  }),
});

export type SellerFormData = z.infer<typeof sellerSchema>;
