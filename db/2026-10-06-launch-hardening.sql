-- 2026-10-06 launch hardening. Additive and idempotent. Safe to re-run.
--
-- 1. TRUNCATE / REFERENCES / TRIGGER were still granted to the client roles on
--    most tables (Supabase default grants). PostgREST cannot issue them, but
--    TRUNCATE ignores RLS, so they are removed. The app uses none of them.
-- 2. Claims: stop duplicate pending claims from one user on one provider, and
--    stop claims being filed against a profile that is already owned. Both
--    checks were UI-only before.
-- 3. Profiles: allow a user to delete their own profile row. The account page
--    offered this, but with no DELETE policy it silently did nothing.

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

create unique index if not exists uq_claims_one_pending
  on public.provider_claims (provider_id, claimant_id)
  where status = 'pending';

drop policy if exists claims_insert_own on public.provider_claims;
create policy claims_insert_own on public.provider_claims
  for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and status = 'pending'
    and kind = 'claim'
    and not exists (
      select 1 from public.providers p
      where p.id = provider_id and p.claimed_by is not null
    )
  );

drop policy if exists profiles_self_delete on public.profiles;
create policy profiles_self_delete on public.profiles
  for delete to authenticated
  using (auth.uid() = id);
grant delete on public.profiles to authenticated;

-- Verify:
--   select count(*) from information_schema.role_table_grants
--    where table_schema='public' and privilege_type='TRUNCATE'
--      and grantee in ('anon','authenticated');            -- expect 0
--   select policyname from pg_policies where tablename='profiles';  -- includes profiles_self_delete
