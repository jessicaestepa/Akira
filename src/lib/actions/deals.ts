"use server";

import { supabase, supabaseAdmin } from "@/lib/supabase/client";
import type { Deal } from "@/lib/supabase/types";

const SAMPLE_DEALS: Deal[] = [
  {
    id: "sample-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locale: "en",
    company_code_name: "Project Aurora",
    title: "B2B SaaS platform for logistics management in Mexico",
    country: "Mexico",
    sector: "SaaS",
    business_type: "SaaS",
    monthly_revenue: 85000,
    monthly_profit: 35000,
    annual_revenue: 1020000,
    asking_price: 3500000,
    summary: null,
    teaser:
      "Profitable SaaS with $85K in monthly sales serving logistics companies in Mexico. 90%+ gross margins, 120+ customers, and 18 months of consecutive growth.",
    is_public: true,
    status: "live",
  },
  {
    id: "sample-2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locale: "en",
    company_code_name: "Project Condor",
    title: "E-commerce brand in health supplements across LATAM",
    country: "Colombia",
    sector: "E-commerce",
    business_type: "E-commerce",
    monthly_revenue: 120000,
    monthly_profit: 40000,
    annual_revenue: 1440000,
    asking_price: 2800000,
    summary: null,
    teaser:
      "DTC health supplements brand with $120K monthly revenue. Operates in 3 LATAM markets with a loyal customer base and growing brand recognition.",
    is_public: true,
    status: "live",
  },
  {
    id: "sample-3",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locale: "en",
    company_code_name: "Project Samba",
    title: "Fintech API infrastructure for neobanks in Brazil",
    country: "Brazil",
    sector: "Fintech",
    business_type: "SaaS",
    monthly_revenue: 200000,
    monthly_profit: 60000,
    annual_revenue: 2400000,
    asking_price: 7000000,
    summary: null,
    teaser:
      "Fintech infrastructure company with $200K in monthly sales. Serves 15+ financial institutions in Brazil with regulated API products and strong pipeline.",
    is_public: true,
    status: "live",
  },
];

export async function getPublicDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("is_public", true)
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) return data;
  } catch (err) {
    console.error("Fetch deals error:", err);
  }

  return SAMPLE_DEALS;
}

export async function getAllDeals(): Promise<Deal[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch all deals error:", error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Fetch all deals exception:", err);
    return [];
  }
}
