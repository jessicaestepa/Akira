-- Deal intelligence fields for seller and buyer leads.
alter table seller_leads
  add column if not exists deal_score integer not null default 0,
  add column if not exists deal_stage text not null default 'new',
  add column if not exists thesis_fit_notes text,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists is_starred boolean not null default false,
  add column if not exists last_scored_at timestamptz,
  add column if not exists lp_card_generated boolean not null default false;

alter table buyer_leads
  add column if not exists match_scores jsonb not null default '[]'::jsonb;

create table if not exists deal_activity_log (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_leads(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_seller_leads_deal_score on seller_leads(deal_score desc);
create index if not exists idx_seller_leads_deal_stage on seller_leads(deal_stage);
create index if not exists idx_seller_leads_starred on seller_leads(is_starred);
create index if not exists idx_deal_activity_log_seller_id on deal_activity_log(seller_id);
