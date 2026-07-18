-- ============================================================
-- Trusted Antigua — House content framework + Featured providers
-- Run in: Supabase Dashboard -> SQL Editor. Idempotent / additive.
--
-- TWO DELIBERATELY SEPARATE SYSTEMS:
--   house_cards        = our own promotional/informational cards. Shares the ad
--                        SHAPE (priority, targeting, active, slot) so it can fill
--                        any ad slot and rotate with the same logic. Not paid.
--   featured_providers = editorial highlights chosen by our team. NOT advertising.
--                        Separate table, separate read function, separate rendering,
--                        never labelled "Sponsored". Featuring never affects ratings.
-- ============================================================

-- ---------- 1. House content ----------
create table if not exists house_cards (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  icon            text,               -- emoji / icon key
  image_url       text,               -- optional richer creative
  cta_text        text,               -- null = informational card, no button
  href            text,               -- null = not clickable
  priority        int not null default 0,
  slot_key        text references ad_slots(key) on delete set null,  -- null = any slot
  target_group    text,               -- optional taxonomy targeting (future)
  target_category text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists idx_house_cards_active on house_cards (active, priority desc);

alter table house_cards enable row level security;
drop policy if exists "house_cards_admin" on house_cards;
create policy "house_cards_admin" on house_cards for all using (is_admin()) with check (is_admin());

-- Public read: cards eligible for a slot (pinned to it, or unpinned = any slot).
create or replace function house_cards_for_slot(p_slot text)
returns table (
  id uuid, title text, description text, icon text, image_url text,
  cta_text text, href text, priority int
)
language sql security definer set search_path = public stable
as $$
  select h.id, h.title, h.description, h.icon, h.image_url, h.cta_text, h.href, h.priority
  from house_cards h
  where h.active and (h.slot_key is null or h.slot_key = p_slot)
  order by h.priority desc, h.created_at asc;
$$;
grant execute on function house_cards_for_slot(text) to anon, authenticated;

-- ---------- 2. Featured providers (editorial, NOT advertising) ----------
create table if not exists featured_providers (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  headline    text,                   -- short editorial label
  note        text,                   -- why we're highlighting them
  priority    int not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_featured_active on featured_providers (active, priority desc);

alter table featured_providers enable row level security;
drop policy if exists "featured_providers_admin" on featured_providers;
create policy "featured_providers_admin" on featured_providers for all using (is_admin()) with check (is_admin());

-- Public read: returns ONLY public provider columns (never contact/claimed_by).
create or replace function featured_providers_list(p_limit int default 3)
returns table (
  provider_id uuid, name text, alias text, category_id text, area text,
  photo_url text, trust_level text, headline text, note text, priority int
)
language sql security definer set search_path = public stable
as $$
  select p.id, p.name, p.alias, p.category_id, p.area, p.photo_url, p.trust_level,
         f.headline, f.note, f.priority
  from featured_providers f
  join providers p on p.id = f.provider_id
  where f.active
    and (f.starts_at is null or f.starts_at <= now())
    and (f.ends_at   is null or f.ends_at   >= now())
  order by f.priority desc, f.created_at desc
  limit greatest(coalesce(p_limit, 3), 1);
$$;
grant execute on function featured_providers_list(int) to anon, authenticated;

-- ---------- 3. Seed the initial house content ----------
insert into house_cards (title, description, icon, cta_text, href, priority)
select * from (values
  ('How Trusted Antigua works', 'Real reviews from real residents. Providers can never edit their own ratings.', '🤝', 'See how it works', '/guidelines', 100),
  ('Recommend a provider',      'Know someone reliable? Vouch for them in about 20 seconds.',                    '⭐', 'Write a review',   '/recommend',  95),
  ('How reviews work',          'Every review comes from a real customer. Reports go to our moderation team.',   '📝', 'Read the rules',   '/guidelines', 80),
  ('Hire safely',               'Agree a price up front and keep a record of the work that was done.',           '🛟', null,               null,          70),
  ('Safety tips',               'Check identity, get it in writing, and never pay in full before work starts.',  '🦺', null,               null,          65),
  ('Become a founding supporter','Back the island''s trusted directory. Details before the public launch.',      '🌱', null,               null,          60),
  ('Explore Antigua',           'Tours, watersports and activities across Antigua & Barbuda.',                   '🏝️', 'Browse tourism',   '/find?group=tourism', 55),
  ('Featured local events',     'Find planners, DJs, catering and hire for your next event.',                    '🎉', 'Browse events',    '/find?group=events',  50),
  ('Local charities',           'We offer free space to Antiguan charities and community groups.',               '💚', null,               null,          45),
  ('Community announcements',   'Community notices and island updates will appear here.',                        '📣', null,               null,          40)
) as v(title, description, icon, cta_text, href, priority)
where not exists (select 1 from house_cards);

-- ============================================================
-- Verification:
-- select count(*) from house_cards;                        -- 10
-- select title, priority from house_cards order by priority desc limit 3;
-- select * from house_cards_for_slot('desktop-rail-left'); -- 10 rows (none pinned)
-- select * from featured_providers_list(3);                -- 0 rows until we feature someone
-- ============================================================
