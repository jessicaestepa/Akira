import { supabaseAdmin } from "@/lib/supabase/client";
import type { DealActivityLog, SellerLead } from "@/lib/supabase/types";
import { PipelineWorkspace } from "@/components/admin/pipeline-workspace";

export async function PipelineContent() {
  const { data: sellersData, error: sellersError } = await supabaseAdmin
    .from("seller_leads")
    .select("*")
    .order("deal_score", { ascending: false });
  const { data: activityData, error: activityError } = await supabaseAdmin
    .from("deal_activity_log")
    .select("*")
    .order("created_at", { ascending: false });

  const sellers = (sellersData ?? []) as SellerLead[];
  const activity = (activityData ?? []) as DealActivityLog[];

  const activityBySeller = activity.reduce<Record<string, DealActivityLog[]>>((acc, item) => {
    if (!acc[item.seller_id]) acc[item.seller_id] = [];
    acc[item.seller_id].push(item);
    return acc;
  }, {});

  return (
    <div>
      {(sellersError || activityError) && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Pipeline loaded with partial data. Please run the latest Supabase migrations (deal intelligence + deal
          sources).
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Deal Intelligence Pipeline</h1>
      </div>

      <PipelineWorkspace initialSellers={sellers} activityBySeller={activityBySeller} />
    </div>
  );
}
