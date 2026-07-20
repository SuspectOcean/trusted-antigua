-- 2026-07-20  Owner role, email invitations, permission audit.
--
-- Hierarchy: owner > admin > moderator > member (member = no admins row).
-- Invitations attach by EMAIL at sign-in via claim_role_invitations(), so any
-- auth provider (magic link, Google, future Facebook/WhatsApp) works, and no
-- user IDs are ever inserted by hand.

-- ---------- 1. Roles ----------
alter table admins drop constraint if exists admins_role_check;
alter table admins add constraint admins_role_check check (role in ('owner','admin','moderator'));

-- Promote the operator. Email is verified against auth.users in the same
-- statement; if the email doesn't match, zero rows update and we find out.
update admins a set role = 'owner'
from auth.users u
where a.user_id = u.id and lower(u.email) = 'ross_bloomfield@hotmail.co.uk';

create or replace function my_role() returns text
language sql stable security definer set search_path = public as
$$ select coalesce((select role from admins where user_id = auth.uid()), 'member') $$;
grant execute on function my_role() to authenticated;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from admins where user_id = auth.uid() and role = 'owner') $$;
grant execute on function is_owner() to authenticated;

-- ---------- 2. Audit trail ----------
create table if not exists permission_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  actor_email text,
  action text not null,          -- invited | invite_revoked | invite_claimed | role_granted | role_removed
  target_user uuid,
  target_email text,
  role text,
  detail text,
  created_at timestamptz not null default now()
);
alter table permission_audit enable row level security;
create policy "audit_owner_read" on permission_audit for select using (is_owner());
-- writes happen only inside SECURITY DEFINER functions

-- ---------- 3. Invitations ----------
create table if not exists role_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('admin','moderator')),
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz
);
create index if not exists idx_role_inv_email on role_invitations (lower(email));
alter table role_invitations enable row level security;
-- no policies on purpose: all access via the functions below

create or replace function admin_invite_role(p_email text, p_role text)
returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid;
begin
  if not is_owner() then raise exception 'not_owner'; end if;
  if p_role not in ('admin','moderator') then raise exception 'bad_role'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  if exists (select 1 from admins a join auth.users u on u.id = a.user_id
             where lower(u.email) = lower(p_email)) then
    raise exception 'already_has_role';
  end if;
  if exists (select 1 from role_invitations
             where lower(email) = lower(p_email)
               and accepted_at is null and revoked_at is null and expires_at > now()) then
    raise exception 'already_invited';
  end if;
  insert into role_invitations (email, role, invited_by)
  values (lower(p_email), p_role, auth.uid()) returning id into v_id;
  insert into permission_audit (actor, actor_email, action, target_email, role)
  values (auth.uid(), auth.email(), 'invited', lower(p_email), p_role);
  return v_id;
end $$;
grant execute on function admin_invite_role(text, text) to authenticated;

create or replace function admin_revoke_invitation(p_id uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
declare v record;
begin
  if not is_owner() then raise exception 'not_owner'; end if;
  select * into v from role_invitations where id = p_id and accepted_at is null and revoked_at is null;
  if not found then raise exception 'not_pending'; end if;
  update role_invitations set revoked_at = now() where id = p_id;
  insert into permission_audit (actor, actor_email, action, target_email, role)
  values (auth.uid(), auth.email(), 'invite_revoked', v.email, v.role);
end $$;
grant execute on function admin_revoke_invitation(uuid) to authenticated;

create or replace function admin_list_invitations()
returns table (id uuid, email text, role text, created_at timestamptz, expires_at timestamptz,
               accepted_at timestamptz, revoked_at timestamptz, status text)
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('owner','admin') then raise exception 'not_admin'; end if;
  return query
    select i.id, i.email, i.role, i.created_at, i.expires_at, i.accepted_at, i.revoked_at,
      case when i.accepted_at is not null then 'accepted'
           when i.revoked_at  is not null then 'revoked'
           when i.expires_at < now()      then 'expired'
           else 'pending' end
    from role_invitations i
    order by i.created_at desc limit 200;
end $$;
grant execute on function admin_list_invitations() to authenticated;

-- Called by the client once after every sign-in. Single-use, expiry-checked,
-- email matched server-side against the authenticated session.
create or replace function claim_role_invitations()
returns text
language plpgsql security definer set search_path = public, auth as $$
declare v record; v_current text;
begin
  if auth.uid() is null or auth.email() is null then return null; end if;
  select role into v_current from admins where user_id = auth.uid();
  if v_current = 'owner' then return 'owner'; end if;

  select * into v from role_invitations
  where lower(email) = lower(auth.email())
    and accepted_at is null and revoked_at is null and expires_at > now()
  order by case role when 'admin' then 1 else 2 end
  limit 1;
  if not found then return v_current; end if;

  update role_invitations set accepted_at = now(), accepted_by = auth.uid() where id = v.id;
  insert into admins (user_id, role) values (auth.uid(), v.role)
  on conflict (user_id) do update set role = excluded.role
  where admins.role <> 'owner';
  insert into permission_audit (actor, actor_email, action, target_user, target_email, role, detail)
  values (auth.uid(), auth.email(), 'invite_claimed', auth.uid(), lower(auth.email()), v.role, v.id::text);
  return v.role;
end $$;
grant execute on function claim_role_invitations() to authenticated;

-- ---------- 4. Tightened role management ----------
create or replace function admin_set_admin(p_user uuid, p_make boolean, p_role text default 'admin')
returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_caller text; v_target text; v_email text;
begin
  v_caller := my_role();
  if v_caller not in ('owner','admin') then raise exception 'not_admin'; end if;
  if p_role = 'owner' then raise exception 'owner_not_assignable'; end if;
  select role into v_target from admins where user_id = p_user;
  if v_target = 'owner' then raise exception 'cannot_change_owner'; end if;
  if p_user = auth.uid() and not p_make then raise exception 'cannot_remove_self'; end if;
  -- only the owner touches admin roles; admins may manage moderators
  if (p_role = 'admin' or v_target = 'admin') and v_caller <> 'owner' then
    raise exception 'not_owner';
  end if;
  select email into v_email from auth.users where id = p_user;
  if p_make then
    if p_role not in ('admin','moderator') then raise exception 'bad_role'; end if;
    insert into admins (user_id, role) values (p_user, p_role)
    on conflict (user_id) do update set role = excluded.role where admins.role <> 'owner';
    insert into permission_audit (actor, actor_email, action, target_user, target_email, role)
    values (auth.uid(), auth.email(), 'role_granted', p_user, v_email, p_role);
  else
    delete from admins where user_id = p_user and role <> 'owner';
    insert into permission_audit (actor, actor_email, action, target_user, target_email, role)
    values (auth.uid(), auth.email(), 'role_removed', p_user, v_email, v_target);
  end if;
end $$;
grant execute on function admin_set_admin(uuid, boolean, text) to authenticated;

create or replace function admin_audit_log()
returns setof permission_audit
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'not_owner'; end if;
  return query select * from permission_audit order by created_at desc limit 200;
end $$;
grant execute on function admin_audit_log() to authenticated;

-- ============================================================
-- Verification:
--   select u.email, a.role from admins a join auth.users u on u.id = a.user_id;  -- expect owner row
--   select my_role();  -- as the operator: 'owner'
-- ============================================================
