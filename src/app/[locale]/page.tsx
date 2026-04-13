import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Search,
  Users,
  Handshake,
  Globe,
  ShieldCheck,
  Building2,
  Heart,
  CheckCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { LatamMap } from "@/components/latam-map";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const steps = [
    { icon: FileText, title: dict.home.how_it_works.step1_title, desc: dict.home.how_it_works.step1_desc },
    { icon: Search, title: dict.home.how_it_works.step2_title, desc: dict.home.how_it_works.step2_desc },
    { icon: Users, title: dict.home.how_it_works.step3_title, desc: dict.home.how_it_works.step3_desc },
    { icon: Handshake, title: dict.home.how_it_works.step4_title, desc: dict.home.how_it_works.step4_desc },
  ];

  const benefits = [
    { icon: Globe, title: dict.home.benefits.b1_title, desc: dict.home.benefits.b1_desc },
    { icon: ShieldCheck, title: dict.home.benefits.b2_title, desc: dict.home.benefits.b2_desc },
    { icon: Building2, title: dict.home.benefits.b3_title, desc: dict.home.benefits.b3_desc },
    { icon: Heart, title: dict.home.benefits.b4_title, desc: dict.home.benefits.b4_desc },
  ];

  const sellerBenefits = [
    dict.home.sellers.benefit1,
    dict.home.sellers.benefit2,
    dict.home.sellers.benefit3,
  ];

  const buyerBenefits = [
    dict.home.buyers.benefit1,
    dict.home.buyers.benefit2,
    dict.home.buyers.benefit3,
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div
          className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none"
          aria-hidden
        />
        <LatamMap className="absolute right-[2%] top-1/2 -translate-y-1/2 h-[120%] w-auto text-primary/40 pointer-events-none select-none hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-primary/[0.06] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
            {dict.home.hero.title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {dict.home.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/sell`}
              className={cn(buttonVariants({ size: "lg" }), "text-base px-8 gap-2")}
            >
              {dict.home.hero.cta_sell}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/deals`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-base px-8")}
            >
              {dict.home.hero.cta_buy}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-primary/[0.04]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center tracking-tight">
            {dict.home.how_it_works.title}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-medium text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section — two columns */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {/* For sellers */}
            <div className="border border-border rounded-xl p-8">
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                {dict.home.sellers.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {dict.home.sellers.subtitle}
              </p>
              <ul className="space-y-3">
                {sellerBenefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/sell`}
                className={cn(buttonVariants(), "mt-8 gap-2")}
              >
                {dict.home.hero.cta_sell}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* For buyers */}
            <div className="border border-border rounded-xl p-8">
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                {dict.home.buyers.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {dict.home.buyers.subtitle}
              </p>
              <ul className="space-y-3">
                {buyerBenefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/deals`}
                className={cn(buttonVariants(), "mt-8 gap-2")}
              >
                {dict.home.hero.cta_buy}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center tracking-tight">
            {dict.home.benefits.title}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-lg">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {dict.home.cta.title}
          </h2>
          <p className="mt-4 text-lg opacity-90">
            {dict.home.cta.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/sell`}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "text-base px-8")}
            >
              {dict.home.cta.cta_sell}
            </Link>
            <Link
              href={`/${locale}/buyers`}
              className="inline-flex items-center justify-center h-9 px-8 text-base font-medium rounded-lg border border-white text-white transition-colors hover:bg-white hover:text-black"
            >
              {dict.home.cta.cta_buy}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
