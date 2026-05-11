-- External deal ingestion: source tracking on seller_leads (pipeline table).
alter table seller_leads
  add column if not exists deal_source text not null default 'organic',
  add column if not exists source_url text,
  add column if not exists source_listing_id text,
  add column if not exists source_data jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

comment on column seller_leads.deal_source is 'organic | flippa | acquire | empire_flippers | bizbuysell | manual';

create unique index if not exists idx_seller_leads_deal_source_listing
  on seller_leads (deal_source, source_listing_id)
  where source_listing_id is not null and length(trim(source_listing_id)) > 0;

create index if not exists idx_seller_leads_deal_source on seller_leads (deal_source);
