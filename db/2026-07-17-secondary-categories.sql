-- ============================================================
-- Trusted Antigua — taxonomy: optional secondary categories
-- Run in: Supabase Dashboard -> SQL Editor. Idempotent / additive.
-- Groups and categories live in code (lib/categories.js); a provider keeps its
-- single primary `category_id` and gains an optional array of extra category slugs.
-- ============================================================

alter table providers
  add column if not exists secondary_categories text[] not null default '{}';

-- Verification (run after applying):
-- select column_name, data_type from information_schema.columns
--   where table_name = 'providers' and column_name = 'secondary_categories';   -- 1 row, ARRAY
-- select count(*) from providers where secondary_categories <> '{}';           -- 0 initially
