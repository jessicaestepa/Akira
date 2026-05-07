"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LpDealCardData } from "@/lib/lp-card-generator";
import { ScoreBreakdown } from "./score-breakdown";

interface Props {
  data: LpDealCardData;
}

function formatMoney(value: number | null): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LpDealCard({ data }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<string | null>(null);

  async function copySummary() {
    const lines = [
      "Aquira Deal Pipeline — Confidential",
      `Deal ID: ${data.dealId}`,
      `Business Type: ${data.businessType}`,
      `Monthly Revenue: ${formatMoney(data.monthlyRevenue)}`,
      `Monthly Profit: ${formatMoney(data.monthlyProfit)}`,
      `Asking Price: ${formatMoney(data.askingPrice)}`,
      `Thesis Fit Score: ${data.thesisScore}/100`,
      `Stage: ${data.stage}`,
      "",
      "Thesis Alignment:",
      ...data.thesisAlignment.map((x) => `- ${x}`),
      "",
      data.confidentialityNotice,
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    setCopyState("Copied summary");
    setTimeout(() => setCopyState(null), 1600);
  }

  function printAsPdf() {
    if (!cardRef.current) return;
    window.print();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={printAsPdf}>
          Download PDF
        </Button>
        <Button type="button" variant="outline" onClick={copySummary}>
          Copy as Text
        </Button>
        {copyState && <span className="text-xs text-muted-foreground">{copyState}</span>}
      </div>

      <div ref={cardRef} className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Aquira Deal Pipeline - Confidential
          </p>
          <h3 className="text-lg font-semibold">{data.dealId}</h3>
          <p className="text-sm text-muted-foreground">{data.businessType}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>Monthly Revenue: {formatMoney(data.monthlyRevenue)}</div>
          <div>Monthly Profit: {formatMoney(data.monthlyProfit)}</div>
          <div>Profit Margin: {data.profitMargin ? `${data.profitMargin}%` : "—"}</div>
          <div>Asking Price: {formatMoney(data.askingPrice)}</div>
          <div>Multiple: {data.impliedMultiple ? `${data.impliedMultiple.toFixed(1)}x` : "—"}</div>
          <div>Stage: {data.stage}</div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Thesis Fit Score: {data.thesisScore}/100</p>
          <ScoreBreakdown breakdown={data.breakdown} />
        </div>

        <div>
          <p className="text-sm font-medium">Thesis Alignment</p>
          <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5">
            {data.thesisAlignment.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">{data.aiLatamOpportunity}</div>
        <div className="text-xs text-muted-foreground border-t pt-3">{data.confidentialityNotice}</div>
      </div>
    </div>
  );
}
