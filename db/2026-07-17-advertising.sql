-- ============================================================
-- Trusted Antigua — Advertising subsystem (foundation)
-- Run in: Supabase Dashboard -> SQL Editor. Idempotent / additive.
--
-- Fully isolated from providers/reviews/users. Base tables are admin-only;
-- the public site reads ads ONLY through ads_for_slot() (SECURITY DEFINER),
-- which returns display-safe fields for currently-live placements.
-- Advertisers have no account and supply only a static image we upload.
-- ============================================================

-- ---------- 1. Slots: the reserved spaces (seeded, referenced by placements) ----------
create table if not exists ad_slots (
  key         text primary key,           -- e.g. 'desktop-rail-left'
  name        text not null,
  placement   text not null,              -- 'desktop-left' | 'desktop-right' | 'mobile-inline'
  width       int,
  height      int,
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- 2. Campaigns: an advertiser booking (internal record, no login) ----------
create table if not exists ad_campaigns (
  id               uuid primary key default gen_random_uuid(),
  advertiser_name  text not null,
  advertiser_contact text,               -- internal only, never exposed publicly
  status           text not null default 'active' check (status in ('draft','active','paused','archived')),
  starts_at        timestamptz,          -- null = live immediately
  ends_at          timestamptz,          -- null = open-ended (expiry)
  priority         int not null default 0,
  -- Future targeting (nullable, unused for now; here so we never redesign):
  target_group     text,
  target_category  text,
  target_area      text,
  target_season    text,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ---------- 3. Creatives: static images for a campaign (multiple = rotation) ----------
create table if not exists ad_creatives (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references ad_campaigns(id) on delete cascade,
  image_url   text not null,
  alt_text    text,
  click_url   text,
  weight      int not null default 1,     -- rotation weighting
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_ad_creatives_campaign on ad_creatives (campaign_id);

-- ---------- 4. Placements: a campaign occupying a slot for a window ----------
create table if not exists ad_placements (
  id          uuid primary key default gen_random_uuid(),
  slot_key    text not null references ad_slots(key) on delete cascade,
  campaign_id uuid not null references ad_campaigns(id) on delete cascade,
  starts_at   timestamptz,
  ends_at     timestamptz,
  priority    int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_ad_placements_slot on ad_placements (slot_key);

-- ---------- 5. Events: impressions/clicks (created now, wired later) ----------
create table if not exists ad_events (
  id           uuid primary key default gen_random_uuid(),
  placement_id uuid references ad_placements(id) on delete set null,
  creative_id  uuid references ad_creatives(id) on delete set null,
  type         text not null check (type in ('impression','click')),
  context      jsonb,                     -- coarse only; never user/review data
  created_at   timestamptz not null default now()
);
create index if not exists idx_ad_events_created on ad_events (type, created_at desc);

-- ---------- 6. RLS: base tables admin-only; public reads via function only ----------
alter table ad_slots      enable row level security;
alter table ad_campaigns  enable row level security;
alter table ad_creatives  enable row level security;
alter table ad_placements enable row level security;
alter table ad_events     enable row level security;

drop policy if exists "ad_slots_admin"      on ad_slots;
drop policy if exists "ad_campaigns_admin"  on ad_campaigns;
drop policy if exists "ad_creatives_admin"  on ad_creatives;
drop policy if exists "ad_placements_admin" on ad_placements;
drop policy if exists "ad_events_admin"     on ad_events;
create policy "ad_slots_admin"      on ad_slots      for all using (is_admin()) with check (is_admin());
create policy "ad_campaigns_admin"  on ad_campaigns  for all using (is_admin()) with check (is_admin());
create policy "ad_creatives_admin"  on ad_creatives  for all using (is_admin()) with check (is_admin());
create policy "ad_placements_admin" on ad_placements for all using (is_admin()) with check (is_admin());
create policy "ad_events_admin"     on ad_events     for all using (is_admin()) with check (is_admin());

-- ---------- 7. Public read: the ONLY way the site sees ads ----------
create or replace function ads_for_slot(p_slot text)
returns table (
  creative_id  uuid,
  placement_id uuid,
  image_url    text,
  alt_text     text,
  click_url    text,
  sponsor      text,
  priority     int,
  weight       int
)
language sql security definer set search_path = public stable
as $$
  select cr.id, pl.id, cr.image_url, cr.alt_text, cr.click_url, ca.advertiser_name,
         greatest(pl.priority, ca.priority), cr.weight
  from ad_placements pl
  join ad_campaigns  ca on ca.id = pl.campaign_id
  join ad_creatives  cr on cr.campaign_id = ca.id and cr.active
  where pl.slot_key = p_slot
    and pl.active and ca.status = 'active'
    and (pl.starts_at is null or pl.starts_at <= now())
    and (pl.ends_at   is null or pl.ends_at   >= now())
    and (ca.starts_at is null or ca.starts_at <= now())
    and (ca.ends_at   is null or ca.ends_at   >= now())
  order by greatest(pl.priority, ca.priority) desc, cr.created_at desc;
$$;

-- ---------- 8. Event logging (ready for later; not yet called by the client) ----------
create or replace function log_ad_event(p_placement uuid, p_creative uuid, p_type text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_type not in ('impression','click') then return; end if;
  insert into ad_events (placement_id, creative_id, type) values (p_placement, p_creative, p_type);
end $$;

grant execute on function ads_for_slot(text) to anon, authenticated;
grant execute on function log_ad_event(uuid, uuid, text) to anon, authenticated;

-- ---------- 9. Seed the launch slots ----------
insert into ad_slots (key, name, placement, width, height, sort) values
  ('desktop-rail-left',  'Desktop left rail',  'desktop-left',  160, 600, 1),
  ('desktop-rail-right', 'Desktop right rail', 'desktop-right', 160, 600, 2),
  ('mobile-inline',      'Mobile inline',      'mobile-inline', 320, 120, 3)
on conflict (key) do nothing;

-- ---------- 10. Storage bucket for creatives (admin upload, public read) ----------
insert into storage.buckets (id, name, public) values ('ad-creatives', 'ad-creatives', true)
on conflict (id) do nothing;

drop policy if exists "ad_creatives_admin_write" on storage.objects;
create policy "ad_creatives_admin_write" on storage.objects for all
  using (bucket_id = 'ad-creatives' and is_admin())
  with check (bucket_id = 'ad-creatives' and is_admin());

-- ============================================================
-- Verification (run after applying):
-- select key, placement from ad_slots order by sort;                 -- 3 rows
-- select proname from pg_proc where proname in ('ads_for_slot','log_ad_event'); -- 2 rows
-- select * from ads_for_slot('desktop-rail-left');                   -- 0 rows (no ads yet)
-- ============================================================
