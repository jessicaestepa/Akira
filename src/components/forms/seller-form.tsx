"use client";

import { useState } from "react";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { submitSellerForm } from "@/lib/actions/seller";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

interface SellerFormProps {
  locale: Locale;
  dict: Dictionary;
}

const countries = ["mexico", "brazil", "colombia", "chile", "argentina", "peru", "other"] as const;
const countryFlags: Record<string, string> = {
  mexico: "\u{1F1F2}\u{1F1FD}", brazil: "\u{1F1E7}\u{1F1F7}", colombia: "\u{1F1E8}\u{1F1F4}",
  chile: "\u{1F1E8}\u{1F1F1}", argentina: "\u{1F1E6}\u{1F1F7}", peru: "\u{1F1F5}\u{1F1EA}", other: "\u{1F30E}",
};
const businessTypes = ["saas", "ecommerce", "agency", "marketplace", "fintech", "healthtech", "edtech", "other"] as const;
const revenueRanges = ["pre_revenue", "under_5k", "5k_20k", "20k_50k", "50k_plus"] as const;
const profitabilityOptions = ["profitable", "break_even", "not_profitable"] as const;
const askingPriceRanges = ["under_100k", "100k_250k", "250k_500k", "500k_1m", "1m_plus"] as const;

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SellerForm({ locale, dict }: SellerFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (consent) formData.set("consent_checkbox", "on");
    else formData.delete("consent_checkbox");

    const result = await submitSellerForm(formData);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || dict.common.error);
    }
    setLoading(false);
  }

  const t = dict.sell;

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <CheckCircle className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{dict.thank_you.title}</h2>
        <p className="mt-3 text-muted-foreground">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />

      <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
        {t.note}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</span>
          {t.step1_title}
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
          {t.step2_title}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {/* Step 1: About you */}
      <div className={step === 1 ? "space-y-5" : "hidden"}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t.fields.full_name} *</Label>
            <Input id="full_name" name="full_name" required placeholder={t.placeholders.full_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.fields.email} *</Label>
            <Input id="email" name="email" type="email" required placeholder={t.placeholders.email} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">{t.fields.company_name} *</Label>
            <Input id="company_name" name="company_name" required placeholder={t.placeholders.company_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t.fields.website}</Label>
            <Input id="website" name="website" type="url" placeholder={t.placeholders.website} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.fields.country} *</Label>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <label key={c} className="relative">
                <input type="radio" name="country" value={c} required className="peer sr-only" />
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-input bg-background cursor-pointer transition-colors hover:bg-muted peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary">
                  <span>{countryFlags[c]}</span>
                  {dict.common.countries[c]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button type="button" onClick={() => setStep(2)} className="gap-2">
          {t.next} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Step 2: About your company */}
      <div className={step === 2 ? "space-y-5" : "hidden"}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business_type">{t.fields.business_type} *</Label>
            <select id="business_type" name="business_type" required className={selectClass}>
              <option value="">{dict.common.select_type}</option>
              {businessTypes.map((bt) => (
                <option key={bt} value={bt}>{dict.common.business_types[bt]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">{t.fields.industry}</Label>
            <Input id="industry" name="industry" placeholder={t.placeholders.industry} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="revenue_range">{t.fields.revenue_range} *</Label>
            <select id="revenue_range" name="revenue_range" required className={selectClass}>
              <option value="">{dict.common.select_type}</option>
              {revenueRanges.map((r) => (
                <option key={r} value={r}>{dict.common.revenue_ranges[r]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profitability_status">{t.fields.profitability_status}</Label>
            <select id="profitability_status" name="profitability_status" className={selectClass}>
              <option value="">{dict.common.select_type}</option>
              {profitabilityOptions.map((p) => (
                <option key={p} value={p}>{dict.common.profitability[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="asking_price_range">{t.fields.asking_price_range}</Label>
          <select id="asking_price_range" name="asking_price_range" className={selectClass}>
            <option value="">{dict.common.select_type}</option>
            {askingPriceRanges.map((a) => (
              <option key={a} value={a}>{dict.common.asking_price_ranges[a]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason_for_selling">{t.fields.reason_for_selling}</Label>
          <Textarea id="reason_for_selling" name="reason_for_selling" placeholder={t.placeholders.reason_for_selling} rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="additional_notes">{t.fields.additional_notes}</Label>
          <Textarea id="additional_notes" name="additional_notes" placeholder={t.placeholders.additional_notes} rows={2} />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="consent_checkbox" checked={consent} onCheckedChange={(val) => setConsent(val === true)} />
          <Label htmlFor="consent_checkbox" className="text-sm leading-relaxed">{t.fields.consent} *</Label>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Button>
          <Button type="submit" disabled={loading || !consent}>
            {loading ? t.submitting : t.submit}
          </Button>
        </div>
      </div>
    </form>
  );
}
