-- Add new range/dropdown fields to seller_leads
alter table seller_leads
  add column if not exists revenue_range text,
  add column if not exists profitability_status text,
  add column if not exists asking_price_range text;

-- Add new range field to buyer_leads
alter table buyer_leads
  add column if not exists check_size_range text;

-- Make old numeric fields nullable (they already are, but be explicit)
-- No changes needed: monthly_revenue, monthly_profit, annual_revenue_optional,
-- asking_price, team_size, min_check_size, max_check_size, target_revenue_range
-- are all already nullable.
