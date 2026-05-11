import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { ingestManualLead } from "@/lib/ingestion/engine";
import { supabaseAdmin } from "@/lib/supabase/client";
import type { SellerLead } from "@/lib/supabase/types";
import type { PipelineBusinessType } from "@/lib/ingestion/normalizer";

const bodySchema = z.object({
  company_name: z.string().min(1),
  business_type: z.string().min(1),
  monthly_revenue: z.number().nullable().optional(),
  monthly_profit: z.number().nullable().optional(),
  asking_price: z.number().nullable().optional(),
  country: z.string().min(1),
  website: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  manual_origin: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const b = parsed.data;
  const out = await ingestManualLead({
    company_name: b.company_name,
    business_type: b.business_type as PipelineBusinessType,
    monthly_revenue: b.monthly_revenue ?? null,
    monthly_profit: b.monthly_profit ?? null,
    asking_price: b.asking_price ?? null,
    country: b.country,
    website: b.website ?? null,
    industry: b.industry ?? null,
    additional_notes: b.notes ?? null,
    profitability_status:
      (b.monthly_revenue ?? 0) > 0 && (b.monthly_profit ?? 0) > 0 ? "profitable" : null,
    manual_origin: b.manual_origin ?? null,
  });

  if (!out.ok) {
    return NextResponse.json({ error: out.error ?? "Failed" }, { status: 500 });
  }

  const { data: sellers } = await supabaseAdmin.from("seller_leads").select("*").order("deal_score", { ascending: false });

  return NextResponse.json({
    success: true,
    id: out.id,
    sellers: (sellers ?? []) as SellerLead[],
  });
}
