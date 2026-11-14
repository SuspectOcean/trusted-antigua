-- 2026-11-14 (b)  Materials: collection fee and receipts.
--
-- Builds on db/2026-11-14-materials-indicator.sql.
-- * A provider who supplies materials can state their own collection and supply
--   fee (0 to 100 percent) and whether they show receipts. It is THEIR stated
--   term, shown as such. The platform sets no rate.
-- * Rule enforced here, not only in the UI: a fee above 0 requires receipts.
-- * Reviewers who did not buy all the materials themselves can answer "Were you
--   shown the receipts?" (yes | no). Community owned, read-only to the provider.
-- * provider_materials() gains columns, so it is dropped and recreated in this
--   same transaction. The live frontend ignores columns it does not know.
-- * Additive and idempotent. Nothing on providers is touched.

alter table public.provider_materials add column if not exists fee_pct smallint;
alter table public.provider_materials add column if not exists receipts boolean;
alter table public.provider_materials drop constraint if exists chk_pm_fee;
alter table public.provider_materials add constraint chk_pm_fee
  check (fee_pct is null or fee_pct between 0 and 100);
alter table public.provider_materials drop constraint if exists chk_pm_receipts;
alter table public.provider_materials add constraint chk_pm_receipts
  check (fee_pct is null or fee_pct = 0 or receipts is true);

alter table public.recommendations add column if not exists receipts_shown text;
alter table public.recommendations drop constraint if exists chk_receipts_shown;
alter table public.recommendations add constraint chk_receipts_shown
  check (receipts_shown is null or receipts_shown in ('yes', 'no'));

create or replace function public.set_provider_materials_terms(p_provider_id uuid, p_fee_pct int, p_receipts boolean)
returns void
language plpgsql security definer set search_path to 'public', 'auth' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from providers where id = p_provider_id and claimed_by = auth.uid())
     and not coalesce(is_admin(), false) then
    raise exception 'not_owner';
  end if;
  if p_fee_pct is not null and (p_fee_pct < 0 or p_fee_pct > 100) then raise exception 'bad_fee'; end if;
  if coalesce(p_fee_pct, 0) > 0 and p_receipts is not true then raise exception 'receipts_required'; end if;
  update provider_materials
     set fee_pct = p_fee_pct, receipts = p_receipts, updated_by = auth.uid(), updated_at = now()
   where provider_id = p_provider_id;
  if not found then raise exception 'no_statement'; end if;
end $$;

create or replace function public.set_review_receipts(p_provider_id uuid, p_answer text)
returns void
language plpgsql security definer set search_path to 'public', 'auth' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_answer is not null and p_answer not in ('yes', 'no') then raise exception 'bad_value'; end if;
  update recommendations set receipts_shown = p_answer
   where provider_id = p_provider_id and recommender_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'no_review'; end if;
end $$;

create or replace function public.my_review_receipts(p_provider_id uuid)
returns text
language sql security definer set search_path to 'public', 'auth' stable as $$
  select r.receipts_shown
    from recommendations r
   where r.provider_id = p_provider_id and r.recommender_id = auth.uid() and r.deleted_at is null
   limit 1;
$$;

drop function if exists public.provider_materials(uuid);
create function public.provider_materials(p_provider_id uuid default null)
returns table (
  provider_id uuid, declared text,
  n_reports int, n_yes int, n_no int, n_partly int,
  status text, source text,
  fee_pct int, receipts boolean,
  n_receipts_yes int, n_receipts_no int
)
language sql security definer set search_path to 'public', 'auth' stable as $$
  with rep as (
    select r.provider_id as pid,
           (count(*) filter (where r.materials_by_customer is not null))::int as n,
           (count(*) filter (where r.materials_by_customer = 'yes'))::int as y,
           (count(*) filter (where r.materials_by_customer = 'no'))::int as nn,
           (count(*) filter (where r.materials_by_customer = 'partly'))::int as pt,
           (count(*) filter (where r.receipts_shown = 'yes'))::int as ry,
           (count(*) filter (where r.receipts_shown = 'no'))::int as rn
      from recommendations r
     where r.deleted_at is null
       and (r.materials_by_customer is not null or r.receipts_shown is not null)
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
              else null end,
         m.fee_pct::int, m.receipts,
         coalesce(rep.ry, 0), coalesce(rep.rn, 0)
    from providers p
    left join provider_materials m on m.provider_id = p.id
    left join rep on rep.pid = p.id
   where p.status = 'listed'
     and (p_provider_id is null or p.id = p_provider_id)
     and (m.provider_id is not null or rep.pid is not null);
$$;

revoke all on function public.set_provider_materials_terms(uuid, int, boolean) from public, anon;
revoke all on function public.set_review_receipts(uuid, text) from public, anon;
revoke all on function public.my_review_receipts(uuid) from public, anon;
revoke all on function public.provider_materials(uuid) from public;
grant execute on function public.set_provider_materials_terms(uuid, int, boolean) to authenticated;
grant execute on function public.set_review_receipts(uuid, text) to authenticated;
grant execute on function public.my_review_receipts(uuid) to authenticated;
grant execute on function public.provider_materials(uuid) to anon, authenticated;

-- ============================================================
-- Verification:
--   select * from provider_materials();
--   select count(*) from providers where status = 'listed';   -- unchanged
-- Rollback:
--   drop function set_provider_materials_terms(uuid, int, boolean); drop function set_review_receipts(uuid, text);
--   drop function my_review_receipts(uuid);
--   alter table provider_materials drop column fee_pct, drop column receipts;
--   alter table recommendations drop column receipts_shown;
--   then re-run db/2026-11-14-materials-indicator.sql to restore the earlier provider_materials().
-- ============================================================
