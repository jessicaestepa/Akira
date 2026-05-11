import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { ingestFromFlippa } from "@/lib/ingestion/engine";
import { supabaseAdmin } from "@/lib/supabase/client";
import type { SellerLead } from "@/lib/supabase/types";

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { types?: string[]; maxPrice?: number; minPrice?: number; pages?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* defaults */
  }

  const result = await ingestFromFlippa({
    types: body.types,
    maxPrice: body.maxPrice,
    minPrice: body.minPrice,
    pages: body.pages ?? 1,
  });

  const { data: sellers } = await supabaseAdmin.from("seller_leads").select("*").order("deal_score", { ascending: false });

  return NextResponse.json({
    ...result,
    sellers: (sellers ?? []) as SellerLead[],
  });
}
