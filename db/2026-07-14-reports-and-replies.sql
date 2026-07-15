-- ============================================================
-- Trusted Antigua — Review reporting, provider disputes, right of reply
-- Run in: Supabase Dashboard → SQL Editor. Idempotent / additive.
-- ============================================================

-- ---------- 1. Review reports (covers user reports AND provider disputes) ----------
create table if not exists review_reports (
  id                  uuid primary key default gen_random_uuid(),
  review_id           uuid not null references recommendations(id) on delete cascade,
  provider_id         uuid not null references providers(id) on delete cascade,
  reporter_id         uuid not null references auth.users(id) on delete cascade,
  is_provider_dispute boolean not null default false,  -- derived server-side, never client-supplied
  reason              text not null check (reason in ('not_genuine','abusive','personal_info','conflict_of_interest','other')),
  details             text check (details is null or char_length(details) <= 2000),
  status              text not null default 'open' check (status in ('open','resolved')),
  resolution          text check (resolution in ('kept','removed')),
  admin_note          text,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

-- One OPEN report per user per review (they can report again after resolution if needed).
create unique index if not exists uq_review_reports_open
  on review_reports (review_id, reporter_id) where (status = 'open');
create index if not exists idx_review_reports_status on review_reports (status, created_at desc);

alter table review_reports enable row level security;

-- Reporter can see their own reports; admins see all. All writes go through RPCs.
drop policy if exists "reports_select" on review_reports;
create policy "reports_select" on review_reports for select
  using (reporter_id = auth.uid() or is_admin());

-- ---------- 2. Right of reply (one reply per review, by the claimed owner) ----------
create table if not exists review_replies (
  id             uuid primary key default gen_random_uuid(),
  review_id      uuid not null unique references recommendations(id) on delete cascade,
  provider_id    uuid not null references providers(id) on delete cascade,
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null check (char_length(body) between 1 and 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  removed_at     timestamptz,
  removed_reason text
);

create index if not exists idx_review_replies_provider on review_replies (provider_id);

alter table review_replies enable row level security;

-- Replies are readable by signed-in users (same gate as review content).
-- Removed replies are visible only to admins and their author.
drop policy if exists "replies_select" on review_replies;
create policy "replies_select" on review_replies for select
  to authenticated
  using (removed_at is null or author_id = auth.uid() or is_admin());

-- ---------- 3. RPC: report a review (user report or provider dispute) ----------
create or replace function report_review(p_review_id uuid, p_reason text, p_details text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_provider_id uuid;
  v_claimed_by uuid;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;

  select r.provider_id, p.claimed_by into v_provider_id, v_claimed_by
  from recommendations r join providers p on p.id = r.provider_id
  where r.id = p_review_id and r.deleted_at is null;
  if v_provider_id is null then raise exception 'review_not_found'; end if;

  insert into review_reports (review_id, provider_id, reporter_id, is_provider_dispute, reason, details)
  values (p_review_id, v_provider_id, v_uid, (v_claimed_by is not null and v_claimed_by = v_uid), p_reason, nullif(trim(p_details), ''))
  on conflict (review_id, reporter_id) where (status = 'open') do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from review_reports
    where review_id = p_review_id and reporter_id = v_uid and status = 'open';
  end if;
  return v_id;
end $$;

-- ---------- 4. RPC: admin resolves a report (keep or remove the review) ----------
create or replace function admin_resolve_report(p_report_id uuid, p_remove boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_review_id uuid;
begin
  if not is_admin() then raise exception 'not_admin'; end if;

  select review_id into v_review_id from review_reports where id = p_report_id and status = 'open';
  if v_review_id is null then raise exception 'report_not_found_or_resolved'; end if;

  if p_remove then
    update recommendations
      set deleted_at = now(),
          deleted_reason = coalesce(p_note, 'moderation: reported')
      where id = v_review_id and deleted_at is null;
    -- Removing the review resolves every open report on it.
    update review_reports
      set status = 'resolved', resolution = 'removed', admin_note = p_note, resolved_at = now()
      where review_id = v_review_id and status = 'open';
  else
    update review_reports
      set status = 'resolved', resolution = 'kept', admin_note = p_note, resolved_at = now()
      where id = p_report_id;
  end if;
end $$;

-- ---------- 5. RPC: claimed owner replies to a review (create or edit) ----------
create or replace function reply_to_review(p_review_id uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_provider_id uuid;
  v_body text := trim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 1000 then raise exception 'reply_length'; end if;

  select r.provider_id into v_provider_id
  from recommendations r join providers p on p.id = r.provider_id
  where r.id = p_review_id and r.deleted_at is null and p.claimed_by = v_uid;
  if v_provider_id is null then raise exception 'not_your_review_to_answer'; end if;

  if exists (select 1 from review_replies where review_id = p_review_id and removed_at is not null) then
    raise exception 'reply_removed_by_moderation';
  end if;

  insert into review_replies (review_id, provider_id, author_id, body)
  values (p_review_id, v_provider_id, v_uid, v_body)
  on conflict (review_id) do update
    set body = excluded.body, updated_at = now();

  select id into v_id from review_replies where review_id = p_review_id;
  return v_id;
end $$;

-- ---------- 6. RPC: admin removes a reply ----------
create or replace function admin_remove_reply(p_reply_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  update review_replies
    set removed_at = now(), removed_reason = coalesce(p_reason, 'moderation')
    where id = p_reply_id and removed_at is null;
end $$;

-- ---------- 7. Lock down function execution ----------
revoke execute on function report_review(uuid, text, text) from anon;
revoke execute on function reply_to_review(uuid, text) from anon;
revoke execute on function admin_resolve_report(uuid, boolean, text) from anon;
revoke execute on function admin_remove_reply(uuid, text) from anon;

-- ---------- 8. Tech debt: drop the dead pre-5A recommendation RPC ----------
drop function if exists public.submit_recommendation(uuid, text, text, text, text, text, text, text, boolean, boolean, boolean, boolean, boolean);

-- ============================================================
-- Verification (run after applying; all should succeed / return rows)
-- ============================================================
-- select count(*) from review_reports;            -- 0, no error
-- select count(*) from review_replies;            -- 0, no error
-- select proname from pg_proc where proname in
--   ('report_review','admin_resolve_report','reply_to_review','admin_remove_reply'); -- 4 rows
