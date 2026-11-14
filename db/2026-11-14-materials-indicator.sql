-- 2026-11-14  "Who supplies the materials?" indicator.
--
-- Design:
-- * Two sources, kept apart (trust firewall):
--     provider_materials.declared            what the provider SAYS (description, owner editable)
--     recommendations.materials_by_customer  what each reviewer EXPERIENCED (reputation, community owned)
-- * The provider statement lives in its own table, NOT a column on providers:
--   providers uses column-level grants and one missing grant empties the whole
--   public directory (the 17 to 20 July outage). Nothing here touches providers.
-- * No existing function is replaced. submit_review / submit_review_v2 are
--   untouched; the reviewer answer is written by a separate RPC after the review
--   is saved. Fully additive and idempotent.
-- * provider_materials() is the single read path. With 3 or more reviewer
--   reports the status comes from customers (majority, else 'varies') and the
--   provider statement no longer decides it. Below 3 the provider statement is
--   shown, labelled as theirs. Reviewer derived data is returned to signed-in
--   users only, matching how ratings are gated.
-- * The status never feeds the Trust Rating or the sort order.

alter table public.recommendations add column if not exists materials_by_customer text;
alter table public.recommendations drop constraint if exists chk_materials_by_customer;
alter table public.recommendations add constraint chk_materials_by_customer
  check (materials_by_customer is null or materials_by_customer in ('yes', 'no', 'partly'));

create table if not exists public.provider_materials (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  declared text not null check (declared in ('supplies', 'customer', 'varies')),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.provider_materials enable row level security;
revoke all on public.provider_materials from public, anon, authenticated;

create or replace function public.set_provider_materials(p_provider_id uuid, p_declared text)
returns void
language plpgsql security definer set search_path to 'public', 'auth' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from providers where id = p_provider_id and claimed_by = auth.uid())
     and not coalesce(is_admin(), false) then
    raise exception 'not_owner';
  end if;
  if p_declared is null then
    delete from provider_materials where provider_id = p_provider_id;
    return;
  end if;
  if p_declared not in ('supplies', 'customer', 'varies') then raise exception 'bad_value'; end if;
  insert into provider_materials (provider_id, declared, updated_by, updated_at)
  values (p_provider_id, p_declared, auth.uid(), now())
  on conflict (provider_id) do update
    set declared = excluded.declared, updated_by = excluded.updated_by, updated_at = now();
end $$;

create or replace function public.set_review_materials(p_provider_id uuid, p_answer text)
returns void
language plpgsql security definer set search_path to 'public', 'auth' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_answer is not null and p_answer not in ('yes', 'no', 'partly') then raise exception 'bad_value'; end if;
  update recommendations set materials_by_customer = p_answer
   where provider_id = p_provider_id and recommender_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'no_review'; end if;
end $$;

create or replace function public.my_review_materials(p_provider_id uuid)
returns text
language sql security definer set search_path to 'public', 'auth' stable as $$
  select r.materials_by_customer
    from recommendations r
   where r.provider_id = p_provider_id and r.recommender_id = auth.uid() and r.deleted_at is null
   limit 1;
$$;

create or replace function public.provider_materials(p_provider_id uuid default null)
returns table (
  provider_id uuid, declared text,
  n_reports int, n_yes int, n_no int, n_partly int,
  status text, source text
)
language sql security definer set search_path to 'public', 'auth' stable as $$
  with rep as (
    select r.provider_id as pid,
           count(*)::int as n,
           (count(*) filter (where r.materials_by_customer = 'yes'))::int as y,
           (count(*) filter (where r.materials_by_customer = 'no'))::int as nn,
           (count(*) filter (where r.materials_by_customer = 'partly'))::int as pt
      from recommendations r
     where r.deleted_at is null
       and r.materials_by_customer is not null
       and auth.uid() is not null
       and (p_provider_id is null or r.provider_id = p_provider_id)
     group by r.provider_id
  )
  select p.id, m.declared,
         coalesce(rep.n, 0), coalesce(rep.y, 0), coalesce(rep.nn, 0), coalesce(rep.pt, 0),
         case when coalesce(rep.n, 0) >= 3 then
                case when rep.y * 2 > rep.n then 'customer'
                     when rep.nn * 2 > rep.n then 'supplies'
                     else 'varies' end
              else m.declared end,
         case when coalesce(rep.n, 0) >= 3 then 'customers'
              when m.declared is not null then 'provider'
              else null end
    from providers p
    left join provider_materials m on m.provider_id = p.id
    left join rep on rep.pid = p.id
   where p.status = 'listed'
     and (p_provider_id is null or p.id = p_provider_id)
     and (m.provider_id is not null or rep.pid is not null);
$$;

revoke all on function public.set_provider_materials(uuid, text) from public, anon;
revoke all on function public.set_review_materials(uuid, text) from public, anon;
revoke all on function public.my_review_materials(uuid) from public, anon;
revoke all on function public.provider_materials(uuid) from public;
grant execute on function public.set_provider_materials(uuid, text) to authenticated;
grant execute on function public.set_review_materials(uuid, text) to authenticated;
grant execute on function public.my_review_materials(uuid) to authenticated;
grant execute on function public.provider_materials(uuid) to anon, authenticated;

-- ============================================================
-- Verification (run after applying):
--   select * from provider_materials();                 -- SQL editor has no auth.uid(): provider statements only
--   select proname from pg_proc where proname in ('set_provider_materials','set_review_materials','my_review_materials','provider_materials');
--   select count(*) from providers where status = 'listed';   -- unchanged
-- Rollback (nothing else depends on these):
--   drop function provider_materials(uuid); drop function my_review_materials(uuid);
--   drop function set_review_materials(uuid, text); drop function set_provider_materials(uuid, text);
--   drop table provider_materials; alter table recommendations drop column materials_by_customer;
-- ============================================================
