export type LeadSource =
  | "organic"
  | "flippa"
  | "acquire"
  | "empire_flippers"
  | "bizbuysell"
  | "manual";

export type LeadStatus =
  | "new"
  | "qualified"
  | "rejected"
  | "contacted"
  | "intro_sent"
  | "in_process"
  | "closed";

export type DealStatus = "draft" | "live" | "archived";

export type DealStage =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "in_due_diligence"
  | "lp_ready"
  | "passed";

export type DiligenceStatus =
  | "not_started"
  | "in_progress"
  | "needs_followup"
  | "cleared"
  | "blocked";

export type DiligenceRecommendation =
  | "undecided"
  | "continue"
  | "pass"
  | "lp_ready";

/** Stored on seller_leads.score_breakdown (dimensions + thesis strings). */
export type SellerScoreBreakdownStored = DealScoreBreakdown & {
  flags?: string[];
  redFlags?: string[];
};

export interface SellerLead {
  id: string;
  created_at: string;
  locale: string;
  full_name: string;
  email: string;
  company_name: string;
  website: string | null;
  country: string;
  business_type: string;
  industry: string | null;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  annual_revenue_optional: number | null;
  team_size: number | null;
  asking_price: number | null;
  revenue_range: string | null;
  profitability_status: string | null;
  asking_price_range: string | null;
  reason_for_selling: string | null;
  additional_notes: string | null;
  consent_checkbox: boolean;
  status: LeadStatus;
  deal_score: number;
  deal_stage: DealStage;
  thesis_fit_notes: string | null;
  score_breakdown: SellerScoreBreakdownStored;
  is_starred: boolean;
  last_scored_at: string | null;
  lp_card_generated: boolean;
  /** Pipeline origin; defaults to organic when column not migrated yet */
  deal_source?: LeadSource | null;
  source_url?: string | null;
  source_listing_id?: string | null;
  source_data?: Record<string, unknown> | null;
  imported_at?: string | null;
}

export interface BuyerLead {
  id: string;
  created_at: string;
  locale: string;
  full_name: string;
  email: string;
  firm_name_optional: string | null;
  buyer_type: string;
  website_or_linkedin_optional: string | null;
  preferred_geographies: string[];
  preferred_sectors: string[];
  min_check_size: number | null;
  max_check_size: number | null;
  check_size_range: string | null;
  target_revenue_range: string | null;
  acquisition_interest: string | null;
  additional_notes: string | null;
  consent_checkbox: boolean;
  status: LeadStatus;
  match_scores: BuyerMatchScore[];
}

export interface DealScoreBreakdown {
  businessType: number;
  recurringRevenue: number;
  marginProfile: number;
  valuationMultiple: number;
  aiOpportunity: number;
  marketSize: number;
}

export interface BuyerMatchScore {
  seller_id: string;
  score: number;
  reasons: string[];
}

export interface DealActivityLog {
  id: string;
  seller_id: string;
  action:
    | "stage_change"
    | "score_update"
    | "note_added"
    | "lp_card_generated"
    | "starred"
    | "deal_imported"
    | "diligence_started"
    | "diligence_updated";
  details: Record<string, unknown>;
  created_at: string;
}

export interface DealDiligenceReview {
  id: string;
  seller_id: string;
  status: "in_progress" | "blocked" | "complete";
  recommendation: DiligenceRecommendation;
  executive_summary: string | null;
  primary_risk: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealDiligenceChecklistItem {
  id: string;
  review_id: string;
  category: string;
  label: string;
  status: DiligenceStatus;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DealDiligenceQuestion {
  id: string;
  review_id: string;
  question: string;
  answer: string | null;
  status: "open" | "answered" | "closed";
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealDiligenceRisk {
  id: string;
  review_id: string;
  title: string;
  severity: "low" | "medium" | "high";
  probability: "low" | "medium" | "high";
  mitigation: string | null;
  decision_impact: string | null;
  status: "open" | "mitigated" | "accepted";
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  created_at: string;
  updated_at: string;
  locale: string;
  company_code_name: string;
  title: string;
  country: string;
  sector: string;
  business_type: string | null;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  annual_revenue: number | null;
  asking_price: number | null;
  summary: string | null;
  teaser: string | null;
  is_public: boolean;
  status: DealStatus;
}
