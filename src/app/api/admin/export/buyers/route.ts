import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";

const HEADERS = [
  "id", "created_at", "locale", "full_name", "email", "firm_name_optional",
  "buyer_type", "website_or_linkedin_optional", "preferred_geographies",
  "preferred_sectors", "check_size_range", "min_check_size", "max_check_size",
  "target_revenue_range", "acquisition_interest", "additional_notes", "status",
];

export async function GET() {
  const cookieStore = await cookies();
  const token = readAdminSessionCookieValue(cookieStore);

  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("buyer_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[export/buyers] Supabase error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const csv = toCsv(HEADERS, data ?? []);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aqüira-buyers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
