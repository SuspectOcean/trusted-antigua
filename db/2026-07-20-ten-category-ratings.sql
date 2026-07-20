-- 2026-07-20  Ten-category rating system (rating_version 2).
--
-- Design:
-- * Ten 1-10 scores stored individually on recommendations; total_score is a
--   GENERATED column so the database computes it — browser totals are never
--   trusted. percentage = total_score (/100), average = total_score / 10.0.
-- * rating_version: 1 = legacy 5A review (scores all null), 2 = ten-category
--   (scores all required). Enforced by CHECK, so no half-rated rows can exist.
-- * Legacy reviews are never backfilled with invented scores.
-- * provider_ratings view aggregates ONLY rating_version=2 rows and reads ONLY
--   recommendations. No join to ads, house content, featured, trust_level or
--   claims — the Trust Rating cannot be influenced by any commercial state.
-- * submit_review_v2 wraps the existing submit_review (provider creation and
--   one-review-per-customer upsert are reused), validates scores server-side,
--   and derives recommender_display from profiles server-side.
-- * Future weighting (verified jobs, reviewer trust, recency) = new aggregate
--   over these stored per-review scores; no remodel needed. For now every
--   valid v2 review counts equally.

-- ---------- 1. Columns ----------
alter table recommendations add column if not exists rating_version smallint not null default 1;
alter table recommendations add column if not exists r10_quality smallint;
alter table recommendations add column if not exists r10_reliability smallint;
alter table recommendations add column if not exists r10_communication smallint;
alter table recommendations add column if not exists r10_punctuality smallint;
alter table recommendations add column if not exists r10_professionalism smallint;
alter table recommendations add column if not exists r10_knowledge smallint;
alter table recommendations add column if not exists r10_value smallint;
alter table recommendations add column if not exists r10_care smallint;
alter table recommendations add column if not exists r10_resolution smallint;
alter table recommendations add column if not exists r10_recommendation smallint;

alter table recommendations drop constraint if exists chk_r10_range;
alter table recommendations add constraint chk_r10_range check (
  (r10_quality        is null or r10_quality        between 1 and 10) and
  (r10_reliability    is null or r10_reliability    between 1 and 10) and
  (r10_communication  is null or r10_communication  between 1 and 10) and
  (r10_punctuality    is null or r10_punctuality    between 1 and 10) and
  (r10_professionalism is null or r10_professionalism between 1 and 10) and
  (r10_knowledge      is null or r10_knowledge      between 1 and 10) and
  (r10_value          is null or r10_value          between 1 and 10) and
  (r10_care           is null or r10_care           between 1 and 10) and
  (r10_resolution     is null or r10_resolution     between 1 and 10) and
  (r10_recommendation is null or r10_recommendation between 1 and 10)
);

alter table recommendations drop constraint if exists chk_r10_complete;
alter table recommendations add constraint chk_r10_complete check (
  (rating_version = 1
    and r10_quality is null and r10_reliability is null and r10_communication is null
    and r10_punctuality is null and r10_professionalism is null and r10_knowledge is null
    and r10_value is null and r10_care is null and r10_resolution is null and r10_recommendation is null)
  or
  (rating_version = 2
    and r10_quality is not null and r10_reliability is not null and r10_communication is not null
    and r10_punctuality is not null and r10_professionalism is not null and r10_knowledge is not null
    and r10_value is not null and r10_care is not null and r10_resolution is not null and r10_recommendation is not null)
);

-- DB-computed total. Null for legacy rows (null propagation), 10-100 for v2.
alter table recommendations add column if not exists total_score smallint
  generated always as (
    r10_quality + r10_reliability + r10_communication + r10_punctuality + r10_professionalism +
    r10_knowledge + r10_value + r10_care + r10_resolution + r10_recommendation
  ) stored;

-- Column-grant lesson from 2026-07-20: new columns on tables with column-level
-- grants do NOT inherit access. Reviews are sign-in gated -> authenticated only.
grant select (rating_version, r10_quality, r10_reliability, r10_communication, r10_punctuality,
  r10_professionalism, r10_knowledge, r10_value, r10_care, r10_resolution, r10_recommendation, total_score)
  on recommendations to authenticated;

-- ---------- 2. Public aggregates (headline + breakdown) ----------
create or replace view provider_ratings as
select
  provider_id,
  count(*)::int                          as r10_count,
  round(avg(total_score))::int           as trust_pct,      -- Trust Rating %
  round(avg(total_score) / 10.0, 1)      as avg_out_of_10,
  round(avg(r10_quality), 1)             as avg_quality,
  round(avg(r10_reliability), 1)         as avg_reliability,
  round(avg(r10_communication), 1)       as avg_communication,
  round(avg(r10_punctuality), 1)         as avg_punctuality,
  round(avg(r10_professionalism), 1)     as avg_professionalism,
  round(avg(r10_knowledge), 1)           as avg_knowledge,
  round(avg(r10_value), 1)               as avg_value,
  round(avg(r10_care), 1)                as avg_care,
  round(avg(r10_resolution), 1)          as avg_resolution,
  round(avg(r10_recommendation), 1)      as avg_recommendation
from recommendations
where deleted_at is null and rating_version = 2
group by provider_id;
grant select on provider_ratings to anon, authenticated;

-- ---------- 3. Submission (server-validated) ----------
create or replace function submit_review_v2(
  p_provider_id uuid, p_name text, p_category_id text, p_area text, p_contact text,
  p_review jsonb, p_scores jsonb
) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_pid uuid;
  v_display text;
  k text;
  v int;
  keys text[] := array['quality','reliability','communication','punctuality','professionalism',
                       'knowledge','value','care','resolution','recommendation'];
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  -- Validate all ten scores server-side: present, integer, 1..10.
  foreach k in array keys loop
    if p_scores->>k is null then raise exception 'missing_score_%', k; end if;
    v := (p_scores->>k)::int;
    if v < 1 or v > 10 then raise exception 'bad_score_%', k; end if;
  end loop;

  -- Reuse the existing, proven path for provider find/create + one-review-per-
  -- customer upsert (RLS, dedupe, contact gating all unchanged).
  v_pid := submit_review(p_provider_id, p_name, p_category_id, p_area, p_contact, p_review);

  -- Server-derived display name (never trust the browser for identity).
  select coalesce(nullif(trim(first_name), '') || coalesce(', ' || nullif(trim(area), ''), ''), 'A resident')
    into v_display from profiles where id = auth.uid();

  update recommendations set
    rating_version      = 2,
    r10_quality         = (p_scores->>'quality')::smallint,
    r10_reliability     = (p_scores->>'reliability')::smallint,
    r10_communication   = (p_scores->>'communication')::smallint,
    r10_punctuality     = (p_scores->>'punctuality')::smallint,
    r10_professionalism = (p_scores->>'professionalism')::smallint,
    r10_knowledge       = (p_scores->>'knowledge')::smallint,
    r10_value           = (p_scores->>'value')::smallint,
    r10_care            = (p_scores->>'care')::smallint,
    r10_resolution      = (p_scores->>'resolution')::smallint,
    r10_recommendation  = (p_scores->>'recommendation')::smallint,
    recommender_display = coalesce(v_display, 'A resident')
  where provider_id = v_pid and recommender_id = auth.uid() and deleted_at is null;

  return v_pid;
end $$;
grant execute on function submit_review_v2(uuid, text, text, text, text, jsonb, jsonb) to authenticated;

-- ============================================================
-- Verification:
--   select rating_version, count(*) from recommendations group by 1;  -- all 1s pre-launch
--   select * from provider_ratings;                                    -- empty until first v2 review
--   set role anon; select * from provider_ratings; reset role;         -- public read OK
-- ============================================================
