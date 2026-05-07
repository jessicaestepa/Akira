import { NextResponse } from "next/server";
import { scoreAllDeals } from "@/lib/deal-scoring";
import { supabaseAdmin } from "@/lib/supabase/client";
import { matchBuyerToSellers } from "@/lib/match-scoring";

export async function POST() {
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
