"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DealActivityLog, SellerLead } from "@/lib/supabase/types";
import { PipelineFilters } from "./pipeline-filters";
import { DealDetailPanel } from "./deal-detail-panel";

interface Props {
  sellers: SellerLead[];
  activityBySeller: Record<string, DealActivityLog[]>;
}

function formatCurrency(value: number | null): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreColor(score: number): string {
  if (score > 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function calcMultiple(s: SellerLead): number | null {
  const asking =
    s.asking_price ??
    (s.asking_price_range === "1m_plus"
      ? 1000000
      : s.asking_price_range === "500k_1m"
      ? 500000
      : s.asking_price_range === "250k_500k"
      ? 250000
      : s.asking_price_range === "100k_250k"
      ? 100000
      : s.asking_price_range === "under_100k"
      ? 50000
      : null);
  const annualRev =
    s.annual_revenue_optional ??
    (s.monthly_revenue ? s.monthly_revenue * 12 : null) ??
    (s.revenue_range === "50k_plus"
      ? 600000
      : s.revenue_range === "20k_50k"
      ? 240000
      : s.revenue_range === "5k_20k"
      ? 60000
      : s.revenue_range === "under_5k"
      ? 12000
      : null);

  if (!asking || !annualRev || annualRev <= 0) return null;
  return asking / annualRev;
}

export function PipelineTable({ sellers, activityBySeller }: Props) {
  const [rows, setRows] = useState<SellerLead[]>(sellers);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [businessType, setBusinessType] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");

  const selectedSeller = rows.find((s) => s.id === selectedSellerId) ?? null;

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return [...rows]
      .filter((s) => (stage === "all" ? true : s.deal_stage === stage))
      .filter((s) =>
        businessType
          ? (s.business_type ?? "").toLowerCase().includes(businessType.toLowerCase())
          : true
      )
      .filter((s) => (starredOnly ? s.is_starred : true))
      .filter((s) => s.deal_score >= minScore)
      .filter((s) => {
        if (!lowerSearch) return true;
        return (
          s.company_name.toLowerCase().includes(lowerSearch) ||
          (s.additional_notes ?? "").toLowerCase().includes(lowerSearch) ||
          (s.reason_for_selling ?? "").toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.deal_score - a.deal_score;
        if (sortBy === "asking") return (b.asking_price ?? 0) - (a.asking_price ?? 0);
        if (sortBy === "revenue") return (b.monthly_revenue ?? 0) - (a.monthly_revenue ?? 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rows, stage, businessType, starredOnly, minScore, search, sortBy]);

  async function updateSeller(id: string, patch: Partial<SellerLead>) {
    const res = await fetch(`/api/admin/pipeline/seller/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Update failed");
    setRows((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function rescoreAll() {
    const res = await fetch("/api/admin/pipeline/rescore", { method: "POST" });
    if (!res.ok) throw new Error("Rescore failed");
    const payload = (await res.json()) as { sellers: SellerLead[] };
    setRows(payload.sellers);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{filtered.length} deals shown</div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">Sort: score</option>
            <option value="created">Sort: date</option>
            <option value="asking">Sort: asking</option>
            <option value="revenue">Sort: revenue</option>
          </select>
          <Button type="button" variant="outline" onClick={rescoreAll}>
            Re-score All
          </Button>
        </div>
      </div>

      <PipelineFilters
        stage={stage}
        setStage={setStage}
        businessType={businessType}
        setBusinessType={setBusinessType}
        starredOnly={starredOnly}
        setStarredOnly={setStarredOnly}
        search={search}
        setSearch={setSearch}
        minScore={minScore}
        setMinScore={setMinScore}
      />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2">★</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">Asking</th>
              <th className="px-3 py-2">Multiple</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Flags</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const multiple = calcMultiple(s);
              const breakdown = s.score_breakdown ?? {};
              const goodFlags = [
                breakdown.businessType >= 20 ? "SaaS fit" : null,
                breakdown.marginProfile >= 10 ? "High margin" : null,
                breakdown.valuationMultiple >= 10 ? "Attractive multiple" : null,
              ].filter(Boolean) as string[];
              const redFlags = [
                breakdown.recurringRevenue <= 5 ? "Low recurring" : null,
                breakdown.marginProfile === 0 ? "No profitability" : null,
              ].filter(Boolean) as string[];
              return (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/25">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => updateSeller(s.id, { is_starred: !s.is_starred })}
                      className={s.is_starred ? "text-amber-500" : "text-muted-foreground"}
                    >
                      ★
                    </button>
                  </td>
                  <td className={`px-3 py-2 font-semibold ${scoreColor(s.deal_score)}`}>
                    {s.deal_score}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{s.company_name}</p>
                    <p className="text-xs text-muted-foreground">{s.country}</p>
                  </td>
                  <td className="px-3 py-2">{s.business_type}</td>
                  <td className="px-3 py-2">{formatCurrency(s.monthly_revenue)}</td>
                  <td className="px-3 py-2">{formatCurrency(s.asking_price)}</td>
                  <td className="px-3 py-2">{multiple ? `${multiple.toFixed(1)}x` : "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={s.deal_stage}
                      onChange={(e) =>
                        updateSeller(s.id, { deal_stage: e.target.value as SellerLead["deal_stage"] })
                      }
                    >
                      <option value="new">new</option>
                      <option value="reviewing">reviewing</option>
                      <option value="shortlisted">shortlisted</option>
                      <option value="lp_ready">lp_ready</option>
                      <option value="passed">passed</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {goodFlags.map((flag) => (
                        <Badge key={flag} variant="secondary">
                          {flag}
                        </Badge>
                      ))}
                      {redFlags.map((flag) => (
                        <Badge key={flag} variant="destructive">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => setSelectedSellerId(s.id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DealDetailPanel
        seller={selectedSeller}
        activities={selectedSeller ? activityBySeller[selectedSeller.id] ?? [] : []}
        onClose={() => setSelectedSellerId(null)}
        onSaveNotes={async (id, notes) => updateSeller(id, { thesis_fit_notes: notes })}
        onGenerateCard={async (id) => updateSeller(id, { lp_card_generated: true })}
      />
    </div>
  );
}
