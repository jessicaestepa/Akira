"use client";

import { useState } from "react";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

interface BuyerFormProps {
  locale: Locale;
  dict: Dictionary;
}

const countries = ["mexico", "brazil", "colombia", "chile", "argentina", "peru", "other"] as const;
const countryFlags: Record<string, string> = {
  mexico: "\u{1F1F2}\u{1F1FD}", brazil: "\u{1F1E7}\u{1F1F7}", colombia: "\u{1F1E8}\u{1F1F4}",
  chile: "\u{1F1E8}\u{1F1F1}", argentina: "\u{1F1E6}\u{1F1F7}", peru: "\u{1F1F5}\u{1F1EA}", other: "\u{1F30E}",
};
const sectors = ["saas", "ecommerce", "fintech", "healthtech", "edtech", "marketplace", "agency", "other"] as const;
const buyerTypes = ["search_fund", "operator", "founder", "private_investor", "family_office", "strategic_buyer", "private_equity", "other"] as const;
const checkSizeRanges = ["under_100k", "100k_250k", "250k_500k", "500k_1m", "1m_plus"] as const;

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function BuyerForm({ locale, dict }: BuyerFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      locale: fd.get("locale"),
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      firm_name_optional: fd.get("firm_name_optional") || undefined,
      buyer_type: fd.get("buyer_type"),
      website_or_linkedin_optional:
        fd.get("website_or_linkedin_optional") || undefined,
      preferred_geographies: selectedGeos,
      preferred_sectors: selectedSectors,
      check_size_range: fd.get("check_size_range"),
      acquisition_interest: fd.get("acquisition_interest") || undefined,
      additional_notes: fd.get("additional_notes") || undefined,
      consent_checkbox: consent,
    };

    try {
      const res = await fetch("/api/buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || dict.common.error);
      }
    } catch {
      setError(dict.common.error);
    }
    setLoading(false);
  }

  const t = dict.buyers;

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
            <Label htmlFor="firm_name_optional">{t.fields.firm_name}</Label>
            <Input id="firm_name_optional" name="firm_name_optional" placeholder={t.placeholders.firm_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer_type">{t.fields.buyer_type} *</Label>
            <select id="buyer_type" name="buyer_type" required className={selectClass}>
              <option value="">{dict.common.select_type}</option>
              {buyerTypes.map((bt) => (
                <option key={bt} value={bt}>{dict.common.buyer_types[bt]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website_or_linkedin_optional">{t.fields.website_linkedin}</Label>
          <Input id="website_or_linkedin_optional" name="website_or_linkedin_optional" type="url" placeholder={t.placeholders.website_linkedin} />
        </div>

        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            const form = document.querySelector("form") as HTMLFormElement | null;
            if (!form) return;
            const name = form.querySelector<HTMLInputElement>('[name="full_name"]');
            const email = form.querySelector<HTMLInputElement>('[name="email"]');
            const buyerType = form.querySelector<HTMLSelectElement>('[name="buyer_type"]');

            if (!name?.value.trim() || !email?.value.trim() || !buyerType?.value) {
              [name, email, buyerType].forEach((el) => el?.reportValidity());
              return;
            }
            if (!email.checkValidity()) {
              email.reportValidity();
              return;
            }
            setError(null);
            setStep(2);
          }}
        >
          {t.next} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Step 2: What you're looking for */}
      <div className={step === 2 ? "space-y-5" : "hidden"}>
        {/* Geographies with flags */}
        <div className="space-y-3">
          <Label>{t.fields.preferred_geographies} *</Label>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleItem(selectedGeos, c, setSelectedGeos)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedGeos.includes(c)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input hover:bg-muted"
                }`}
              >
                <span>{countryFlags[c]}</span>
                {dict.common.countries[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Sectors as pills */}
        <div className="space-y-3">
          <Label>{t.fields.preferred_sectors} *</Label>
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleItem(selectedSectors, s, setSelectedSectors)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedSectors.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input hover:bg-muted"
                }`}
              >
                {dict.common.sectors[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_size_range">{t.fields.check_size_range} *</Label>
          <select id="check_size_range" name="check_size_range" required className={selectClass}>
            <option value="">{dict.common.select_type}</option>
            {checkSizeRanges.map((r) => (
              <option key={r} value={r}>{dict.common.check_size_ranges[r]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquisition_interest">{t.fields.acquisition_interest}</Label>
          <Textarea id="acquisition_interest" name="acquisition_interest" placeholder={t.placeholders.acquisition_interest} rows={2} />
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
