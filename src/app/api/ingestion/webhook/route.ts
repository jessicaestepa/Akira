import { NextResponse } from "next/server";
import {
  normalizeAcquireDeal,
  normalizeBizBuySellDeal,
  normalizeEmpireFlippersDeal,
} from "@/lib/ingestion/normalizer";
import { ingestExternalDeals } from "@/lib/ingestion/engine";
import type { LeadSource } from "@/lib/supabase/types";

const SOURCES = new Set<LeadSource>(["acquire", "empire_flippers", "bizbuysell"]);

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.INGESTION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { source?: string; deals?: unknown[] };
  try {
    body = (await request.json()) as { source?: string; deals?: unknown[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { source, deals } = body;
  if (!source || !Array.isArray(deals)) {
    return NextResponse.json({ error: "Invalid payload. Need { source, deals }" }, { status: 400 });
  }

  if (!SOURCES.has(source as LeadSource)) {
    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
  }

  const src = source as LeadSource;
  const normalizer =
    src === "acquire"
      ? normalizeAcquireDeal
      : src === "empire_flippers"
        ? normalizeEmpireFlippersDeal
        : normalizeBizBuySellDeal;

  const result = await ingestExternalDeals(deals, src, (d) => normalizer(d as Record<string, unknown>));

  return NextResponse.json(result);
}
