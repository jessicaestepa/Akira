import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { ingestCsvText } from "@/lib/ingestion/engine";
import { supabaseAdmin } from "@/lib/supabase/client";
import type { SellerLead } from "@/lib/supabase/types";

const bodySchema = z.object({
  csv: z.string().min(1),
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
    return NextResponse.json({ error: "Expected { csv: string }" }, { status: 422 });
  }

  const result = await ingestCsvText(parsed.data.csv);

  const { data: sellers } = await supabaseAdmin.from("seller_leads").select("*").order("deal_score", { ascending: false });

  return NextResponse.json({
    ...result,
    sellers: (sellers ?? []) as SellerLead[],
  });
}
