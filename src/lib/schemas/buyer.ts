import { z } from "zod/v4";

export const buyerSchema = z.object({
  locale: z.string(),
  full_name: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  firm_name_optional: z.string().optional().or(z.literal("")),
  buyer_type: z.string().min(1, "Required"),
  website_or_linkedin_optional: z.string().url().optional().or(z.literal("")),
  preferred_geographies: z.array(z.string()).min(1, "Select at least one"),
  preferred_sectors: z.array(z.string()).min(1, "Select at least one"),
  check_size_range: z.string().min(1, "Required"),
  acquisition_interest: z.string().optional().or(z.literal("")),
  additional_notes: z.string().optional().or(z.literal("")),
  consent_checkbox: z.literal(true, {
    error: "You must consent to continue",
  }),
});

export type BuyerFormData = z.infer<typeof buyerSchema>;
