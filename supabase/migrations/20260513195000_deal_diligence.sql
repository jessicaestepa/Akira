-- Due diligence workspace for seller_leads.

alter table seller_leads
  alter column deal_stage set default 'new';

create table if not exists deal_diligence_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_leads(id) on delete cascade,
  status text not null default 'in_progress',
  recommendation text not null default 'undecided',
  executive_summary text,
  primary_risk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id)
);

create table if not exists deal_diligence_checklist_items (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references deal_diligence_reviews(id) on delete cascade,
  category text not null,
  label text not null,
  status text not null default 'not_started',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deal_diligence_questions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references deal_diligence_reviews(id) on delete cascade,
  question text not null,
  answer text,
  status text not null default 'open',
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deal_diligence_risks (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references deal_diligence_reviews(id) on delete cascade,
  title text not null,
  severity text not null default 'medium',
  probability text not null default 'medium',
  mitigation text,
  decision_impact text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deal_diligence_reviews_seller_id
  on deal_diligence_reviews(seller_id);
create index if not exists idx_deal_diligence_checklist_review_id
  on deal_diligence_checklist_items(review_id, sort_order);
create index if not exists idx_deal_diligence_questions_review_id
  on deal_diligence_questions(review_id, created_at desc);
create index if not exists idx_deal_diligence_risks_review_id
  on deal_diligence_risks(review_id, created_at desc);

create or replace function update_deal_diligence_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists deal_diligence_reviews_updated_at on deal_diligence_reviews;
create trigger deal_diligence_reviews_updated_at
  before update on deal_diligence_reviews
  for each row execute function update_deal_diligence_updated_at();

drop trigger if exists deal_diligence_checklist_items_updated_at on deal_diligence_checklist_items;
create trigger deal_diligence_checklist_items_updated_at
  before update on deal_diligence_checklist_items
  for each row execute function update_deal_diligence_updated_at();

drop trigger if exists deal_diligence_questions_updated_at on deal_diligence_questions;
create trigger deal_diligence_questions_updated_at
  before update on deal_diligence_questions
  for each row execute function update_deal_diligence_updated_at();

drop trigger if exists deal_diligence_risks_updated_at on deal_diligence_risks;
create trigger deal_diligence_risks_updated_at
  before update on deal_diligence_risks
  for each row execute function update_deal_diligence_updated_at();
