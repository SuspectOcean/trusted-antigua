-- ============================================================
-- Trusted Antigua — Admin roles + admin-only user listing
-- Run in: Supabase Dashboard -> SQL Editor. Idempotent / additive.
--
-- Admin access stays an allowlist (`admins.user_id`), which is simple and hard to
-- get wrong. is_admin() is UNCHANGED. We add an optional `role` for future
-- granularity, safe grant/revoke RPCs, and an admin-only user listing.
-- ============================================================

-- ---------- 1. Optional role granularity (is_admin() unaffected) ----------
alter table admins add column if not exists role text not null default 'admin';
alter table admins add column if not exists created_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check') then
    alter table admins add constraint admins_role_check check (role in ('owner','admin','moderator'));
  end if;
end $$;

create unique index if not exists uq_admins_user on admins (user_id);

-- Admins can see the admin list (writes go through the RPCs below).
alter table admins enable row level security;
drop policy if exists "admins_select" on admins;
create policy "admins_select" on admins for select using (is_admin());

-- ---------- 2. Safe grant / revoke ----------
-- Guards: only admins may call; you cannot remove yourself; never remove the last admin.
create or replace function admin_set_admin(p_user uuid, p_make boolean, p_role text default 'admin')
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if p_user is null then raise exception 'no_user'; end if;

  if p_make then
    if coalesce(p_role, 'admin') not in ('owner','admin','moderator') then
      raise exception 'bad_role';
    end if;
    if not exists (select 1 from admins where user_id = p_user) then
      insert into admins (user_id) values (p_user);
    end if;
    update admins set role = coalesce(p_role, 'admin') where user_id = p_user;
  else
    if p_user = auth.uid() then raise exception 'cannot_remove_self'; end if;
    if (select count(*) from admins) <= 1 then raise exception 'last_admin'; end if;
    delete from admins where user_id = p_user;
  end if;
end $$;
grant execute on function admin_set_admin(uuid, boolean, text) to authenticated;

-- ---------- 3. Admin-only user listing (exposes emails: MUST stay gated) ----------
create or replace function admin_list_users()
returns table (
  id uuid, email text, first_name text, area text,
  created_at timestamptz, is_admin boolean, role text
)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return query
    select u.id,
           u.email::text,
           p.first_name,
           p.area,
           u.created_at,
           (a.user_id is not null) as is_admin,
           a.role
    from auth.users u
    left join profiles p on p.id = u.id
    left join admins   a on a.user_id = u.id
    order by u.created_at desc
    limit 500;
end $$;
grant execute on function admin_list_users() to authenticated;

-- ---------- 4. Dashboard counters (single round trip, admin-only) ----------
create or replace function admin_overview()
returns table (
  providers bigint, reviews bigint, open_reports bigint, pending_claims bigint,
  featured bigint, house_cards bigint, ad_campaigns bigint, live_placements bigint, users bigint
)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return query select
    (select count(*) from providers),
    (select count(*) from recommendations where deleted_at is null),
    (select count(*) from review_reports where status = 'open'),
    (select count(*) from provider_claims where status = 'pending'),
    (select count(*) from featured_providers where active),
    (select count(*) from house_cards where active),
    (select count(*) from ad_campaigns where status = 'active'),
    (select count(*) from ad_placements where active),
    (select count(*) from auth.users);
end $$;
grant execute on function admin_overview() to authenticated;

-- ============================================================
-- Verification:
-- select user_id, role from admins;
-- select * from admin_overview();
-- select id, email, is_admin from admin_list_users() limit 5;
-- ============================================================
