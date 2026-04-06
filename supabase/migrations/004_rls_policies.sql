-- Enable Row Level Security on all tables
alter table seller_leads enable row level security;
alter table buyer_leads enable row level security;
alter table deals enable row level security;

-- seller_leads: no public access at all.
-- Only the service role (used by API routes) can insert/select.
-- With RLS enabled and no policies for the anon role, all anon access is denied.

-- buyer_leads: same — no public access.

-- deals: allow anonymous SELECT only for public, live deals.
create policy "Public can view live deals"
  on deals
  for select
  to anon
  using (is_public = true and status = 'live');
