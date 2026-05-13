"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const sourceLine = [
    `Organic (${sourceCounts.organic ?? 0})`,
    `Flippa (${sourceCounts.flippa ?? 0})`,
    `Acquire (${sourceCounts.acquire ?? 0})`,
    `Empire Flippers (${sourceCounts.empire_flippers ?? 0})`,
    `BizBuySell (${sourceCounts.bizbuysell ?? 0})`,
    `Manual (${sourceCounts.manual ?? 0})`,
  ].join(" · ");

  return (
    <div className="mb-6 rounded-lg border bg-muted/20 p-4 text-sm">
      <p className="mb-2 font-semibold">Deal sources</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Flippa sync uses Flippa&apos;s public JSON search API (not a scraper). Other sites can push deals via
        the ingestion webhook if you use Apify or a custom exporter.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button type="button" disabled={syncing} onClick={syncFlippa}>
          {syncing ? "Syncing…" : "Sync Flippa"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowManual(true)}>
          Manual entry
        </Button>
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
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
      <p className="text-muted-foreground">
        Last import logged: <span className="text-foreground">{lastLabel}</span>
      </p>
      <p className="mt-1 text-muted-foreground">{sourceLine}</p>
      {message && <p className="mt-2 text-xs text-foreground">{message}</p>}

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
    </div>
  );
}
