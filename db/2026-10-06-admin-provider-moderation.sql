-- 2026-10-06 admin provider moderation. Additive and idempotent.
--
-- Until now an admin could manage claims but had no way to take down a listing
-- itself (spam, a duplicate, a wrong number, or a person who asks not to be
-- listed) without SQL. These two functions give /admin that control.
-- Hiding sets providers.status = 'hidden'; the existing providers_read policy
-- only returns status = 'listed', so a hidden listing disappears for everyone.
-- Nothing is deleted: reviews stay attached and Restore brings it all back.

create or replace function public.admin_providers_list()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'alias', p.alias, 'category_id', p.category_id,
      'area', p.area, 'status', p.status, 'trust_level', p.trust_level,
      'contact', p.contact, 'claimed', p.claimed_by is not null, 'created_at', p.created_at
    ) order by p.created_at desc)
    from providers p
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_set_provider_status(p_provider_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('listed', 'hidden') then raise exception 'bad_status'; end if;
  update providers set status = p_status where id = p_provider_id;
  if not found then raise exception 'not_found'; end if;
end $$;

revoke all on function public.admin_providers_list() from public, anon;
revoke all on function public.admin_set_provider_status(uuid, text) from public, anon;
grant execute on function public.admin_providers_list() to authenticated;
grant execute on function public.admin_set_provider_status(uuid, text) to authenticated;

-- Verify:
--   select public.admin_providers_list();   -- as admin: array; as non-admin: not_admin
