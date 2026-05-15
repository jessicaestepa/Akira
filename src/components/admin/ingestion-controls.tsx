"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SellerLead } from "@/lib/supabase/types";

const BUSINESS_TYPES = [
  "saas",
  "marketplace",
  "ecommerce",
  "agency",
  "fintech",
  "healthtech",
  "edtech",
  "app",
  "content",
  "other",
] as const;

const MANUAL_ORIGINS = ["Referral", "WhatsApp", "Email", "Conference", "Other"] as const;

const DEFAULT_COUNTS = {
  organic: 0,
  flippa: 0,
  acquire: 0,
  empire_flippers: 0,
  bizbuysell: 0,
  manual: 0,
} as const;

type SourceCountKey = keyof typeof DEFAULT_COUNTS;

const SOURCE_ROWS: Array<{ key: SourceCountKey; label: string; badgeClass: string }> = [
  { key: "organic", label: "Organic", badgeClass: "border-emerald-600/30 bg-emerald-50 text-emerald-950" },
  { key: "flippa", label: "Flippa", badgeClass: "border-sky-600/30 bg-sky-50 text-sky-950" },
  { key: "acquire", label: "Acquire", badgeClass: "border-violet-600/30 bg-violet-50 text-violet-950" },
  {
    key: "empire_flippers",
    label: "Empire Flippers",
    badgeClass: "border-amber-600/30 bg-amber-50 text-amber-950",
  },
  { key: "bizbuysell", label: "BizBuySell", badgeClass: "border-red-600/30 bg-red-50 text-red-950" },
  { key: "manual", label: "Manual", badgeClass: "border-border bg-muted text-foreground" },
];

interface Props {
  sourceCounts: Record<string, number>;
  lastImportAt: string | null;
  onSellersUpdated: (sellers: SellerLead[]) => void;
}

export function IngestionControls({ sourceCounts, lastImportAt, onSellersUpdated }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manual, setManual] = useState({
    company_name: "",
    business_type: "saas",
    monthly_revenue: "" as string,
    monthly_profit: "" as string,
    asking_price: "" as string,
    country: "",
    website: "",
    notes: "",
    manual_origin: "Referral",
  });

  async function syncFlippa() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ingestion/flippa", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: 1 }),
      });
      const data = (await res.json()) as {
        imported?: number;
        duplicates?: number;
        errors?: number;
        messages?: string[];
        sellers?: SellerLead[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Flippa sync failed");
      if (data.sellers) onSellersUpdated(data.sellers);
      setMessage(
        `Imported ${data.imported ?? 0}, duplicates ${data.duplicates ?? 0}, errors ${data.errors ?? 0}. ${(data.messages ?? []).join(" ")}`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSyncing(true);
    const mrev = manual.monthly_revenue === "" ? null : Number(manual.monthly_revenue);
    const mprof = manual.monthly_profit === "" ? null : Number(manual.monthly_profit);
    const ask = manual.asking_price === "" ? null : Number(manual.asking_price);
    try {
      const res = await fetch("/api/admin/ingestion/manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: manual.company_name,
          business_type: manual.business_type,
          monthly_revenue: Number.isFinite(mrev as number) ? mrev : null,
          monthly_profit: Number.isFinite(mprof as number) ? mprof : null,
          asking_price: Number.isFinite(ask as number) ? ask : null,
          country: manual.country || "Unknown",
          website: manual.website || null,
          notes: manual.notes || null,
          manual_origin: manual.manual_origin,
        }),
      });
      const data = (await res.json()) as { sellers?: SellerLead[]; error?: string };
      if (!res.ok) {
        setMessage(data.error || "Manual entry failed");
        return;
      }
      if (data.sellers) onSellersUpdated(data.sellers);
      setShowManual(false);
      setMessage("Deal added.");
      setManual({
        company_name: "",
        business_type: "saas",
        monthly_revenue: "",
        monthly_profit: "",
        asking_price: "",
        country: "",
        website: "",
        notes: "",
        manual_origin: "Referral",
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Manual entry failed");
    } finally {
      setSyncing(false);
    }
  }

  async function onCsvSelected(file: File | null) {
    if (!file) return;
    setMessage(null);
    const text = await file.text();
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/ingestion/csv", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = (await res.json()) as {
        imported?: number;
        duplicates?: number;
        errors?: number;
        sellers?: SellerLead[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "CSV import failed");
      if (data.sellers) onSellersUpdated(data.sellers);
      setMessage(
        `CSV: imported ${data.imported ?? 0}, duplicates ${data.duplicates ?? 0}, errors ${data.errors ?? 0}.`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "CSV failed");
    } finally {
      setSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const lastLabel = lastImportAt
    ? new Date(lastImportAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  const counts = { ...DEFAULT_COUNTS, ...sourceCounts } as Record<SourceCountKey, number>;

  return (
    <>
      <Card className="mb-6" size="sm">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle>Deal sources</CardTitle>
        <CardDescription className="max-w-2xl">
          Import listings into the pipeline. Flippa uses the public JSON search endpoint; other marketplaces
          can POST batches to the ingestion webhook.
        </CardDescription>
        <CardAction>
          <div className="text-right text-xs leading-tight">
            <p className="text-muted-foreground">Last import</p>
            <p className="font-medium tabular-nums text-foreground">{lastLabel}</p>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</p>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button type="button" className="w-full sm:w-auto lg:w-full" disabled={syncing} onClick={syncFlippa}>
              {syncing ? "Syncing…" : "Sync Flippa"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto lg:w-full"
              onClick={() => setShowManual(true)}
            >
              Manual entry
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto lg:w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              CSV upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onCsvSelected(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By source</p>
          <div className="flex flex-wrap gap-2">
            {SOURCE_ROWS.map(({ key, label, badgeClass }) => (
              <Badge
                key={key}
                variant="outline"
                className={`gap-1.5 px-2.5 py-1 text-xs font-normal ${badgeClass}`}
              >
                <span>{label}</span>
                <span className="font-semibold tabular-nums">{counts[key]}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      {message ? (
        <div className="border-t border-border/60 bg-muted/30 px-4 py-3 text-xs text-foreground">
          {message}
        </div>
      ) : null}

      <CardFooter className="flex-col items-stretch gap-2 border-t border-border/60 py-3">
        <details className="group text-xs text-muted-foreground">
          <summary className="cursor-pointer list-none font-medium text-foreground/90 outline-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-muted-foreground/40 underline-offset-2 group-open:no-underline">
              How ingestion works
            </span>
          </summary>
          <p className="mt-2 max-w-3xl leading-relaxed">
            Flippa sync calls Flippa&apos;s public JSON search API (no HTML scraping). For Acquire, Empire
            Flippers, or BizBuySell, send normalized payloads to{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">POST /api/ingestion/webhook</code>{" "}
            with header <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">x-webhook-secret</code>{" "}
            set to <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">INGESTION_WEBHOOK_SECRET</code>
            .
          </p>
        </details>
      </CardFooter>
      </Card>

      {showManual && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setShowManual(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold">Add deal manually</h3>
            <form className="space-y-3" onSubmit={submitManual}>
              <div>
                <Label htmlFor="m_company">Company name *</Label>
                <Input
                  id="m_company"
                  required
                  value={manual.company_name}
                  onChange={(e) => setManual((m) => ({ ...m, company_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="m_type">Business type *</Label>
                <select
                  id="m_type"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={manual.business_type}
                  onChange={(e) => setManual((m) => ({ ...m, business_type: e.target.value }))}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="m_mrev">Monthly revenue (USD)</Label>
                  <Input
                    id="m_mrev"
                    type="number"
                    inputMode="decimal"
                    value={manual.monthly_revenue}
                    onChange={(e) => setManual((m) => ({ ...m, monthly_revenue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="m_mprof">Monthly profit (USD)</Label>
                  <Input
                    id="m_mprof"
                    type="number"
                    inputMode="decimal"
                    value={manual.monthly_profit}
                    onChange={(e) => setManual((m) => ({ ...m, monthly_profit: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="m_ask">Asking price (USD)</Label>
                <Input
                  id="m_ask"
                  type="number"
                  inputMode="decimal"
                  value={manual.asking_price}
                  onChange={(e) => setManual((m) => ({ ...m, asking_price: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="m_country">Country *</Label>
                <Input
                  id="m_country"
                  required
                  value={manual.country}
                  onChange={(e) => setManual((m) => ({ ...m, country: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="m_web">Business URL</Label>
                <Input
                  id="m_web"
                  type="url"
                  placeholder="https://"
                  value={manual.website}
                  onChange={(e) => setManual((m) => ({ ...m, website: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="m_origin">Source</Label>
                <select
                  id="m_origin"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={manual.manual_origin}
                  onChange={(e) => setManual((m) => ({ ...m, manual_origin: e.target.value }))}
                >
                  {MANUAL_ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="m_notes">Notes</Label>
                <textarea
                  id="m_notes"
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={manual.notes}
                  onChange={(e) => setManual((m) => ({ ...m, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowManual(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save deal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
