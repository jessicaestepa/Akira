import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { scoreAllDeals } from "@/lib/deal-scoring";
import { supabaseAdmin } from "@/lib/supabase/client";
import { matchBuyerToSellers } from "@/lib/match-scoring";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const auth = readAdminSessionCookieValue(cookieStore);
  if (!(await verifySessionToken(auth))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await scoreAllDeals();

  const { data: sellers } = await supabaseAdmin.from("seller_leads").select("*");
  const { data: buyers } = await supabaseAdmin.from("buyer_leads").select("*");

  const sellerRows = sellers ?? [];
  const buyerRows = buyers ?? [];

  for (const buyer of buyerRows) {
    const matches = matchBuyerToSellers(buyer, sellerRows).map((match) => ({
      seller_id: match.sellerId,
      score: match.score,
      reasons: match.reasons,
    }));

    await supabaseAdmin
      .from("buyer_leads")
      .update({ match_scores: matches })
      .eq("id", buyer.id);
  }

  return NextResponse.json({ success: true, sellers: sellerRows });
}
