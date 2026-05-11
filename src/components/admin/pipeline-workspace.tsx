"use client";

import { useEffect, useMemo, useState } from "react";
import type { DealActivityLog, SellerLead } from "@/lib/supabase/types";
import { computePipelineStats, countByDealSource } from "@/lib/pipeline-metrics";
import { PipelineStats } from "@/components/admin/pipeline-stats";
import { PipelineTable } from "@/components/admin/pipeline-table";
import { IngestionControls } from "@/components/admin/ingestion-controls";

interface Props {
  initialSellers: SellerLead[];
  activityBySeller: Record<string, DealActivityLog[]>;
}

export function PipelineWorkspace({ initialSellers, activityBySeller }: Props) {
  const [sellers, setSellers] = useState(initialSellers);

  useEffect(() => {
    setSellers(initialSellers);
  }, [initialSellers]);

  const stats = useMemo(() => computePipelineStats(sellers), [sellers]);
  const sourceCounts = useMemo(() => countByDealSource(sellers), [sellers]);

  const lastImportLog = useMemo(() => {
    const flat = Object.values(activityBySeller).flat();
    const hits = flat.filter((a) => a.action === "deal_imported");
    hits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return hits[0] ?? null;
  }, [activityBySeller]);

  return (
    <div>
      <PipelineStats
        totalDeals={stats.totalDeals}
        shortlisted={stats.shortlisted}
        lpReady={stats.lpReady}
        avgScore={stats.avgScore}
        topSectors={stats.topSectors}
        averageAsking={stats.averageAsking}
        averageMultiple={stats.averageMultiple}
        pipelineValue={stats.pipelineValue}
      />

      <IngestionControls
        sourceCounts={sourceCounts}
        lastImportAt={lastImportLog?.created_at ?? null}
        onSellersUpdated={setSellers}
      />

      <PipelineTable sellers={sellers} activityBySeller={activityBySeller} />
    </div>
  );
}
