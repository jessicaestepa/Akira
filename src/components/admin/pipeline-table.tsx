"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DealActivityLog, SellerLead } from "@/lib/supabase/types";
import {
  estimateAnnualRevenue,
  estimateAskingPrice,
  estimateMonthlyRevenue,
} from "@/lib/seller-financials";
import { parseStoredScoreBreakdown } from "@/lib/score-breakdown-parse";
import { PipelineFilters } from "./pipeline-filters";
import { DealDetailPanel } from "./deal-detail-panel";

interface Props {
  sellers: SellerLead[];
  activityBySeller: Record<string, DealActivityLog[]>;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function dealSourceLabel(src: string | null | undefined): string {
  const s = src ?? "organic";
  if (s === "organic") return "Organic";
  if (s === "flippa") return "Flippa";
  if (s === "acquire") return "Acquire";
  if (s === "empire_flippers") return "Empire Flippers";
  if (s === "bizbuysell") return "BizBuySell";
  if (s === "manual") return "Manual";
  return s;
}

function dealSourceBadgeClass(src: string | null | undefined): string {
  const s = src ?? "organic";
  if (s === "organic") return "border-emerald-600/40 bg-emerald-50 text-emerald-900";
  if (s === "flippa") return "border-sky-600/40 bg-sky-50 text-sky-900";
  if (s === "acquire") return "border-violet-600/40 bg-violet-50 text-violet-900";
  if (s === "empire_flippers") return "border-amber-600/40 bg-amber-50 text-amber-950";
  if (s === "bizbuysell") return "border-red-600/40 bg-red-50 text-red-900";
  if (s === "manual") return "border-border bg-muted text-foreground";
  return "border-border bg-muted text-foreground";
}

function calcMultiple(s: SellerLead): number | null {
  const asking = estimateAskingPrice(s);
  const annualRev = estimateAnnualRevenue(s);
  if (!asking || !annualRev || annualRev <= 0) return null;
  return asking / annualRev;
}

function displayMonthlyRevenue(s: SellerLead): number | null {
  const direct = s.monthly_revenue != null && s.monthly_revenue > 0 ? s.monthly_revenue : null;
  if (direct != null) return direct;
  return estimateMonthlyRevenue(s);
}

function displayAsking(s: SellerLead): number | null {
  const direct = s.asking_price != null && s.asking_price > 0 ? s.asking_price : null;
  if (direct != null) return direct;
  return estimateAskingPrice(s);
}


export function PipelineTable({ sellers, activityBySeller }: Props) {
  const [rows, setRows] = useState<SellerLead[]>(sellers);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [businessType, setBusinessType] = useState("");
  const [dealSource, setDealSource] = useState("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    setRows(sellers);
  }, [sellers]);

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
      .filter((s) => (dealSource === "all" ? true : (s.deal_source ?? "organic") === dealSource))
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
        if (sortBy === "asking")
          return (displayAsking(b) ?? 0) - (displayAsking(a) ?? 0);
        if (sortBy === "revenue")
          return (displayMonthlyRevenue(b) ?? 0) - (displayMonthlyRevenue(a) ?? 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rows, stage, businessType, dealSource, starredOnly, minScore, search, sortBy]);

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
        dealSource={dealSource}
        setDealSource={setDealSource}
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
              <th className="px-3 py-2">Source</th>
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
              const breakdown = parseStoredScoreBreakdown(s.score_breakdown);
              const thesisFlags = breakdown.flags ?? [];
              const thesisRed = breakdown.redFlags ?? [];
              const fallbackGood = [
                breakdown.businessType >= 20 ? "SaaS fit" : null,
                breakdown.marginProfile >= 10 ? "High margin" : null,
                breakdown.valuationMultiple >= 10 ? "Attractive multiple" : null,
              ].filter(Boolean) as string[];
              const fallbackRed = [
                breakdown.recurringRevenue <= 5 ? "Low recurring" : null,
                breakdown.marginProfile === 0 ? "No profitability" : null,
              ].filter(Boolean) as string[];
              const goodFlags = thesisFlags.length > 0 ? thesisFlags : fallbackGood;
              const redFlags = thesisRed.length > 0 ? thesisRed : fallbackRed;
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
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{s.company_name}</p>
                        <p className="text-xs text-muted-foreground">{s.country}</p>
                      </div>
                      {s.source_url ? (
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                          title="View original listing"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-xs font-normal ${dealSourceBadgeClass(s.deal_source)}`}>
                      {dealSourceLabel(s.deal_source)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{s.business_type}</td>
                  <td className="px-3 py-2">{formatCurrency(displayMonthlyRevenue(s))}</td>
                  <td className="px-3 py-2">{formatCurrency(displayAsking(s))}</td>
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
