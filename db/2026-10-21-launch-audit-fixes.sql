-- 2026-10-21 launch audit fixes. Additive and idempotent. Apply in the Supabase
-- SQL editor BEFORE pushing the matching frontend commit.
--
-- Covers the four "must fix before public launch" items from the 19 Oct audit:
--   1. Admin view for private concerns (private_warnings) with resolve + note.
--   2. Contact scraping: providers.contact is no longer selectable by ordinary
--      signed-in accounts. It is read one provider at a time through
--      provider_contact(), capped at 25 distinct providers per account per day.
--      Listing owners (their own listings) and admins are exempt from the cap.
--   3. Server-side category validation: a taxonomy table mirrors
--      lib/categories.js and a trigger on providers rejects any category_id or
--      secondary category that is not in it. Covers add_provider_quick,
--      list_self_provider, review-created listings and direct updates.
--      submit_review_v2 (which can still create a listing by typed name) is
--      withdrawn from the API: clients call submit_review_v3, which requires an
--      existing provider id and then delegates to v2 as the function owner.
--   4. Password policy: dashboard setting (Authentication > Providers > Email >
--      Minimum password length = 8). Not SQL. Client minimum raised to 8 in code.
--
-- Verification queries at the bottom.

-- =====================================================================
-- 1. Private concerns: admin list + resolve
-- =====================================================================
alter table public.private_warnings add column if not exists resolved_at  timestamptz;
alter table public.private_warnings add column if not exists resolved_by  uuid;
alter table public.private_warnings add column if not exists admin_note   text;

create or replace function public.admin_private_warnings_list(p_status text default 'open')
returns setof public.private_warnings
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  return query
    select * from private_warnings w
    where case when p_status = 'open' then w.resolved_at is null
               when p_status = 'resolved' then w.resolved_at is not null
               else true end
    order by w.created_at desc
    limit 500;
end $$;
revoke all on function public.admin_private_warnings_list(text) from public, anon;
grant execute on function public.admin_private_warnings_list(text) to authenticated;

create or replace function public.admin_resolve_private_warning(p_id uuid, p_note text default null, p_reopen boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if p_reopen then
    update private_warnings set resolved_at = null, resolved_by = null, admin_note = coalesce(p_note, admin_note) where id = p_id;
  else
    update private_warnings set resolved_at = now(), resolved_by = auth.uid(), admin_note = coalesce(p_note, admin_note) where id = p_id;
  end if;
  if not found then raise exception 'not_found'; end if;
end $$;
revoke all on function public.admin_resolve_private_warning(uuid, text, boolean) from public, anon;
grant execute on function public.admin_resolve_private_warning(uuid, text, boolean) to authenticated;

-- =====================================================================
-- 2. Contact scraping: one provider at a time, daily cap
-- =====================================================================
create table if not exists public.contact_lookups (
  user_id     uuid not null,
  provider_id uuid not null,
  looked_at   timestamptz not null default now(),
  primary key (user_id, provider_id, looked_at)
);
alter table public.contact_lookups enable row level security;
revoke all on public.contact_lookups from anon, authenticated;
create index if not exists contact_lookups_user_day on public.contact_lookups (user_id, looked_at desc);

create or replace function public.provider_contact(p_provider_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_contact text;
  v_owner uuid;
  v_cap int := 25;
  v_used int;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  select contact, claimed_by into v_contact, v_owner from providers where id = p_provider_id;
  if not found then return null; end if;

  -- Owners of the listing and admins are not metered.
  if v_owner = v_uid or is_admin() then return v_contact; end if;

  -- Distinct providers looked up in the last 24 h. Re-opening the same profile is free.
  select count(distinct provider_id) into v_used
    from contact_lookups
   where user_id = v_uid and looked_at > now() - interval '24 hours';
  if v_used >= v_cap and not exists (
       select 1 from contact_lookups
        where user_id = v_uid and provider_id = p_provider_id and looked_at > now() - interval '24 hours')
  then
    raise exception 'contact_limit';
  end if;

  insert into contact_lookups (user_id, provider_id) values (v_uid, p_provider_id);
  return v_contact;
end $$;
revoke all on function public.provider_contact(uuid) from public, anon;
grant execute on function public.provider_contact(uuid) to authenticated;

-- Withdraw the bulk read path. Everything else on providers keeps its grants.
revoke select (contact) on public.providers from authenticated;

-- =====================================================================
-- 3. Taxonomy table + validation trigger
-- =====================================================================
create table if not exists public.taxonomy (
  id         text primary key,
  group_id   text not null,
  name       text not null,
  retired_at timestamptz
);
alter table public.taxonomy enable row level security;
drop policy if exists taxonomy_read on public.taxonomy;
create policy taxonomy_read on public.taxonomy for select using (true);
grant select on public.taxonomy to anon, authenticated;

-- Seed. Regenerate with: node db/scripts/gen-taxonomy-seed.mjs
insert into public.taxonomy (id, group_id, name) values
  ('masonry', 'building', 'Masonry / Building'),
  ('electrical', 'building', 'Electrical'),
  ('plumbing', 'building', 'Plumbing'),
  ('carpentry', 'building', 'Carpentry & Joinery'),
  ('roofing', 'building', 'Roofing'),
  ('painting', 'building', 'Painting & Decorating'),
  ('tiling', 'building', 'Tiling & Flooring'),
  ('welding', 'building', 'Welding & Metalwork'),
  ('contractor', 'building', 'General Contractor'),
  ('architecture', 'building', 'Architects & Surveyors'),
  ('excavation', 'building', 'Excavation & Groundwork'),
  ('ac', 'home', 'AC / Refrigeration'),
  ('cleaning', 'home', 'Cleaning'),
  ('gardening', 'home', 'Gardening / Landscaping'),
  ('pool', 'home', 'Pool Maintenance'),
  ('pest', 'home', 'Pest Control'),
  ('appliance', 'home', 'Appliance Repair'),
  ('handyman', 'home', 'Handyman'),
  ('security', 'home', 'Home Security & CCTV'),
  ('solar', 'home', 'Solar & Energy'),
  ('movers', 'home', 'Moving & Removals'),
  ('interior', 'home', 'Interior Design'),
  ('textiles', 'home', 'Tailoring & Alterations'),
  ('boat_repair', 'marine', 'Boat Repair & Maintenance'),
  ('marine_engine', 'marine', 'Marine Engineering'),
  ('fiberglass', 'marine', 'Fibreglass & Hull'),
  ('marine_electronics', 'marine', 'Marine Electronics'),
  ('rigging', 'marine', 'Sailmaking & Rigging'),
  ('captain', 'marine', 'Captains & Crew'),
  ('yacht_management', 'marine', 'Yacht Management'),
  ('mechanic', 'automotive', 'Auto Mechanic'),
  ('bodywork', 'automotive', 'Bodywork & Paint'),
  ('tyres', 'automotive', 'Tyres & Wheels'),
  ('auto_electric', 'automotive', 'Auto Electrical & AC'),
  ('car_detailing', 'automotive', 'Car Wash & Detailing'),
  ('towing', 'automotive', 'Towing & Recovery'),
  ('motorcycle', 'automotive', 'Motorcycle & Scooter'),
  ('taxi', 'automotive', 'Taxi & Private Driver'),
  ('airport_transfer', 'automotive', 'Airport Transfers'),
  ('delivery', 'automotive', 'Delivery & Courier'),
  ('legal', 'professional', 'Legal & Attorneys'),
  ('accounting', 'professional', 'Accounting & Bookkeeping'),
  ('tax_services', 'professional', 'Tax Services'),
  ('financial_advice', 'professional', 'Financial Advisers'),
  ('consulting', 'professional', 'Business Consulting'),
  ('marketing', 'professional', 'Marketing & PR'),
  ('hr', 'professional', 'HR & Recruitment'),
  ('notary', 'professional', 'Notary & Documents'),
  ('translation', 'professional', 'Translation'),
  ('admin_services', 'professional', 'Admin & Secretarial'),
  ('it_support', 'technology', 'IT Support'),
  ('web_dev', 'technology', 'Web & App Development'),
  ('device_repair', 'technology', 'Computer & Phone Repair'),
  ('networking', 'technology', 'Networking & WiFi'),
  ('av_smart', 'technology', 'AV & Smart Home'),
  ('cybersecurity', 'technology', 'Cybersecurity'),
  ('photography', 'creative', 'Photography'),
  ('videography', 'creative', 'Videography & Film'),
  ('graphic_design', 'creative', 'Graphic Design'),
  ('social_media', 'creative', 'Content & Social Media'),
  ('music', 'creative', 'Musicians & Bands'),
  ('dj', 'creative', 'DJs & Entertainment'),
  ('event_planning', 'creative', 'Event Planning'),
  ('weddings', 'creative', 'Weddings'),
  ('sound_staging', 'creative', 'Sound & Staging'),
  ('florist', 'creative', 'Florist'),
  ('physio', 'health', 'Physiotherapy'),
  ('nursing', 'health', 'Nursing & Home Care'),
  ('fitness', 'health', 'Fitness & Personal Training'),
  ('spa', 'health', 'Massage & Spa Therapy'),
  ('beauty', 'health', 'Beauty & Hair'),
  ('counselling', 'health', 'Counselling & Therapy'),
  ('nutrition', 'health', 'Nutrition & Wellness'),
  ('realtor', 'property', 'Real Estate Agents'),
  ('property_mgmt', 'property', 'Property Management'),
  ('valuation', 'property', 'Valuation & Appraisal'),
  ('tutoring', 'education', 'Tutoring'),
  ('music_lessons', 'education', 'Music Lessons'),
  ('driving_school', 'education', 'Driving Instructors'),
  ('languages', 'education', 'Language Classes'),
  ('childcare', 'education', 'Childcare & Nannies'),
  ('vocational', 'education', 'Vocational Training'),
  ('pet_grooming', 'pets', 'Pet Grooming'),
  ('pet_sitting', 'pets', 'Pet Sitting & Walking'),
  ('private_chef', 'other', 'Private Chef & Catering'),
  ('other', 'other', 'Other Service')
on conflict (id) do update set group_id = excluded.group_id, name = excluded.name, retired_at = null;

create or replace function public.validate_provider_categories()
returns trigger
language plpgsql as $$
declare
  s text;
begin
  if new.category_id is null or not exists (select 1 from taxonomy t where t.id = new.category_id and t.retired_at is null) then
    raise exception 'bad_category' using detail = coalesce(new.category_id, 'null');
  end if;
  if new.secondary_categories is not null then
    foreach s in array new.secondary_categories loop
      if not exists (select 1 from taxonomy t where t.id = s and t.retired_at is null) then
        raise exception 'bad_secondary_category' using detail = s;
      end if;
    end loop;
    -- Drop any duplicate of the primary and cap at 4, matching the UI rule.
    new.secondary_categories := (
      select array_agg(distinct x) from unnest(new.secondary_categories) x where x <> new.category_id
    );
    if coalesce(array_length(new.secondary_categories, 1), 0) > 4 then
      raise exception 'too_many_secondary_categories';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists validate_provider_categories_trg on public.providers;
create trigger validate_provider_categories_trg
  before insert or update of category_id, secondary_categories on public.providers
  for each row execute function public.validate_provider_categories();

-- submit_review_v3: same arguments as v2, but a provider must already exist.
create or replace function public.submit_review_v3(
  p_provider_id uuid, p_name text, p_category_id text, p_area text, p_contact text,
  p_review jsonb, p_scores jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_provider_id is null then raise exception 'provider_required'; end if;
  if not exists (select 1 from providers where id = p_provider_id) then raise exception 'provider_not_found'; end if;
  return submit_review_v2(p_provider_id, null, null, null, null, p_review, p_scores);
end $$;
revoke all on function public.submit_review_v3(uuid, text, text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.submit_review_v3(uuid, text, text, text, text, jsonb, jsonb) to authenticated;

-- v2 and v1 are now internal only (v3 calls v2 as owner; v2 calls v1).
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('submit_review', 'submit_review_v2')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- =====================================================================
-- Verification (run as the owner account after applying)
-- =====================================================================
-- select count(*) from taxonomy;                                   -- 86
-- select id, name, category_id from providers
--   where category_id not in (select id from taxonomy);            -- legacy bad rows to hide via /admin
-- select column_name, privilege_type, grantee from information_schema.column_privileges
--   where table_name = 'providers' and column_name = 'contact';    -- no 'authenticated'
-- select proname from pg_proc where proname in ('provider_contact','submit_review_v3','admin_private_warnings_list','admin_resolve_private_warning');
-- As a non-admin member (test account):
--   select provider_contact('<id>');                               -- phone
--   select contact from providers limit 1;                         -- permission denied
--   select submit_review_v2(null, 'X', 'plumbing', null, null, '{}', '{}'); -- permission denied
