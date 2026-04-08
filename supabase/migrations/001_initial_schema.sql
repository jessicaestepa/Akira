-- Aqüira MVP: Initial database schema

-- Seller leads
create table if not exists seller_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null,
  full_name text not null,
  email text not null,
  company_name text not null,
  website text,
  country text not null,
  business_type text not null,
  industry text,
  monthly_revenue numeric,
  monthly_profit numeric,
  annual_revenue_optional numeric,
  team_size integer,
  asking_price numeric,
  reason_for_selling text,
  additional_notes text,
  consent_checkbox boolean not null default false,
  status text not null default 'new'
);

-- Buyer leads
create table if not exists buyer_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null,
  full_name text not null,
  email text not null,
  firm_name_optional text,
  buyer_type text not null,
  website_or_linkedin_optional text,
  preferred_geographies text[] default '{}',
  preferred_sectors text[] default '{}',
  min_check_size numeric,
  max_check_size numeric,
  target_revenue_range text,
  acquisition_interest text,
  additional_notes text,
  consent_checkbox boolean not null default false,
  status text not null default 'new'
);

-- Deals
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locale text not null default 'en',
  company_code_name text not null,
  title text not null,
  country text not null,
  sector text not null,
  business_type text,
  monthly_revenue numeric,
  monthly_profit numeric,
  annual_revenue numeric,
  asking_price numeric,
  summary text,
  teaser text,
  is_public boolean not null default false,
  status text not null default 'draft'
);

-- Auto-update updated_at on deals
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row
  execute function update_updated_at_column();

-- Indexes
create index idx_seller_leads_status on seller_leads(status);
create index idx_buyer_leads_status on buyer_leads(status);
create index idx_deals_status_public on deals(status, is_public);
