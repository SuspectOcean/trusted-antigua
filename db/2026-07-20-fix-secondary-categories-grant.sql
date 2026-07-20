-- 2026-07-20  Fix: anonymous visitors could not see any providers.
--
-- Cause: `providers` uses COLUMN-LEVEL grants (that is how contact gating works,
-- see the contact columns which are deliberately withheld from anon). The
-- 2026-07-17 secondary-categories migration added `secondary_categories` but did
-- not grant SELECT on it to anon. PostgREST rejects the WHOLE request with 401
-- when any single requested column is denied, so `PUBLIC_COLS` in lib/data.js
-- returned 401 for every logged-out visitor and the directory rendered empty.
--
-- Signed-in users were unaffected, which is why this went unnoticed from
-- 17 to 20 July: all testing happened while authenticated.
--
-- Lesson: any future ALTER TABLE providers ADD COLUMN that is meant to be public
-- MUST be accompanied by a matching column grant to anon.

grant select (secondary_categories) on providers to anon;
grant select (secondary_categories) on providers to authenticated;

-- ============================================================
-- Verification (expect one row, no error):
--   set role anon;
--   select id, secondary_categories from providers limit 1;
--   reset role;
--
-- Full public column set as the app requests it (expect rows, not an error):
--   set role anon;
--   select id, name, alias, category_id, secondary_categories, area, status,
--          created_at, trust_level, description, photo_url, area_scope,
--          service_areas, verified_at
--   from providers order by created_at desc;
--   reset role;
--
-- Confirm contact columns are STILL withheld from anon (expect: permission denied):
--   set role anon;
--   select phone from providers limit 1;
--   reset role;
-- ============================================================
