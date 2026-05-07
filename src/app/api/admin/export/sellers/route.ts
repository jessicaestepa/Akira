import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";

const HEADERS = [
  "id", "created_at", "locale", "full_name", "email", "company_name",
  "website", "country", "business_type", "industry", "revenue_range",
  "profitability_status", "asking_price_range", "monthly_revenue",
  "monthly_profit", "annual_revenue_optional", "team_size", "asking_price",
  "reason_for_selling", "additional_notes", "status",
];

export async function GET() {
  const cookieStore = await cookies();
  const token = readAdminSessionCookieValue(cookieStore);

  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("seller_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[export/sellers] Supabase error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const csv = toCsv(HEADERS, data ?? []);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aqüira-sellers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
