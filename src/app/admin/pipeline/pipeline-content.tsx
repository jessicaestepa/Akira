import { supabaseAdmin } from "@/lib/supabase/client";
import type { DealActivityLog, SellerLead } from "@/lib/supabase/types";
import { PipelineTable } from "@/components/admin/pipeline-table";
import { PipelineStats } from "@/components/admin/pipeline-stats";
import { estimateAnnualRevenue, estimateAskingPrice } from "@/lib/seller-financials";

function toNumber(value: number | null | undefined): number {
  return typeof value === "number" ? value : 0;
}

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

  const totalDeals = sellers.length;
  const shortlisted = sellers.filter((s) => s.deal_stage === "shortlisted").length;
  const lpReady = sellers.filter((s) => s.deal_stage === "lp_ready").length;
  const avgScore =
    totalDeals > 0 ? sellers.reduce((sum, s) => sum + toNumber(s.deal_score), 0) / totalDeals : 0;
  const sectorMap = new Map<string, number>();
  for (const seller of sellers) {
    const sector = (seller.business_type || "other").toLowerCase();
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);
  }
  const topSectors = [...sectorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, count]) => ({ sector, count }));

  const askingValues = sellers.map((s) => estimateAskingPrice(s) ?? 0);
  const revenueValues = sellers.map((s) => estimateAnnualRevenue(s) ?? 0);
  const averageAsking =
    askingValues.length > 0
      ? askingValues.reduce((sum, value) => sum + value, 0) / askingValues.length
      : 0;
  const multipleValues = sellers
    .map((s, idx) => {
      const rev = revenueValues[idx];
      const ask = askingValues[idx];
      if (!rev || rev <= 0 || !ask) return 0;
      return ask / rev;
    })
    .filter((x) => x > 0);
  const averageMultiple =
    multipleValues.length > 0
      ? multipleValues.reduce((sum, value) => sum + value, 0) / multipleValues.length
      : 0;
  const pipelineValue = sellers
    .filter((s) => s.deal_stage === "shortlisted")
    .reduce((sum, s) => sum + (estimateAskingPrice(s) ?? 0), 0);

  return (
    <div>
      {(sellersError || activityError) && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Pipeline loaded with partial data. Please run the latest Supabase migration for deal intelligence fields.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Deal Intelligence Pipeline</h1>
      </div>

      <PipelineStats
        totalDeals={totalDeals}
        shortlisted={shortlisted}
        lpReady={lpReady}
        avgScore={avgScore}
        topSectors={topSectors}
        averageAsking={averageAsking}
        averageMultiple={averageMultiple}
        pipelineValue={pipelineValue}
      />

      <PipelineTable sellers={sellers} activityBySeller={activityBySeller} />
    </div>
  );
}
