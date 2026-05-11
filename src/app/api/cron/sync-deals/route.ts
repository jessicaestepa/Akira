import { NextResponse } from "next/server";
import { ingestFromFlippa } from "@/lib/ingestion/engine";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestFromFlippa({
    types: ["saas", "website", "app", "ecommerce_store", "established_website"],
    maxPrice: 500_000,
    pages: 3,
  });

  console.log("[cron/sync-deals]", result);
  return NextResponse.json(result);
}
