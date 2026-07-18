# Trusted Antigua — Project Handbook (CLAUDE.md)

Single source of truth for this project. Any Claude chat (or developer) should be able to continue development from this file alone. Read it fully before making changes.

---

## 1. Project overview

- **Vision:** become the most trusted source of service recommendations and provider reputation in Antigua & Barbuda — Checkatrade/Trustpilot adapted for Caribbean reality (mobile-first, WhatsApp-first, many informal sole traders).
- **Mission:** connect residents, businesses, tourists, and property owners with local service providers through genuine community reviews that providers can never manipulate.
- **Current stage:** working product live at https://trusted-antigua.vercel.app with directory, accounts, claiming, structured reviews, and moderation. Near-zero real usage — pre-pilot. Legal foundations being finished before growth work.
- **Long-term direction:** all-services directory (trades → marine → transport → professional services), evidence-weighted reputation engine, eventually marketplace-verified jobs. Revenue later, never at the cost of review integrity.

**Guiding principle (locked):** *"You control how you're described. The community controls how you're rated."*

---

## 2. Technology stack

- **Frontend:** Next.js 14.2.15 (App Router, JavaScript — not TypeScript), React 18.3.1, Tailwind CSS 3.4.13. Dark-first theme, warm amber accent, Fraunces (display/names) + Work Sans (UI). `@/*` path alias → repo root.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage). Client uses the **publishable/anon key only**; all protection is server-side (RLS, column grants, `SECURITY DEFINER` RPCs, triggers).
- **Hosting:** Vercel (Hobby). GitHub → auto-deploy on push to `main`.
- **Repo:** https://github.com/SuspectOcean/trusted-antigua (repo root = Next.js app root: `app/`, `components/`, `lib/`, `db/`).
- **Supabase project ref:** `qyvtbftapmdrxrzctunt` (dashboard: supabase.com/dashboard/project/qyvtbftapmdrxrzctunt).
- **Auth:** email magic-link only. Google/Facebook/phone are built but OFF (flags in `components/AuthProvider.js`) pending external config.
- **Database architecture (main objects):** `providers` (public cols gated; `contact`/`claimed_by` signed-in only), `recommendations` (one review per customer–provider, soft-delete via `deleted_at`), `provider_stats` (public aggregate view), `provider_claims`, `category_change_requests`, `private_warnings` (insert-only from client), `profiles`, `review_reports` (user reports + provider disputes), `review_replies` (one reply per review). Writes that carry trust go through RPCs: `submit_review`, `delete_my_review`, `report_review`, `reply_to_review`, `admin_*` (claims, trust level, category, remove/restore review, resolve report, remove reply), `is_admin`.

---

## 3. Current architecture

- **Trust firewall (non-negotiable):** providers can NEVER edit, hide, delete, reorder, or down-weight reviews. Enforced server-side (RLS; guard trigger on `providers` protecting reputation columns; `recommendations` has no direct UPDATE/DELETE for users — all through SECURITY DEFINER RPCs). Reputation numbers derive from reviews and are read-only to everyone except the moderation process.
- **Review system (5A):** two-speed form — fast (would-hire-again Yes/No + finished-work score + tags) or full (six core 0–10 dimensions + 3 optional, work-type tags, timeframe). One editable review per customer–provider. Profile shows would-hire-again %, review count, households served; per-dimension averages only after `DIMENSION_THRESHOLD = 3` scored reviews (`lib/reviews.js`). Review content and provider contact are sign-in gated; summary stats are public.
- **Moderation / legal layer (built July 2026):** any signed-in user can report a review (reason + details); a claimed owner reporting a review of their own business is automatically flagged as a **provider dispute** (derived server-side, never client-supplied). Reports do NOT hide reviews. Admin queue resolves keep/remove; removing resolves all open reports on that review. **Right of reply:** claimed owner gets one public, editable reply per review; admin can remove a reply; removed replies cannot be resurrected. Legal pages: `/privacy` (Data Protection Act 2013-aligned), `/terms` (takedown process, trust rule), `/guidelines` (review rules, dispute rights), linked in a global footer.
- **Provider claiming (F4):** claim → admin approval → owner edits limited public fields (description, photo, areas, contact) → "Verified Business" promotion. Category changes via admin-approved request.
- **Admin Control Centre:** one entry point at `/admin`, nine sections, no hidden developer pages and no manual database edits. `components/AdminShell.js` holds the single `ADMIN_NAV` definition and gates every route on `isAdmin`; each section is its own route so it can grow independently. Sections: Dashboard (counters from `admin_overview()`), Providers (claims, trust promotion, revoke), Reviews (reports and disputes, remove/restore, reply removal), Featured, Advertisements, House Content, Users (role grant/revoke), Categories (change requests + read-only taxonomy), Site Settings (read-only config). Client gating is convenience only: every admin RPC independently raises `not_admin`.
- **Admin roles:** `admins` table is an allowlist, not a public role. `admins.role` is 'admin' or 'moderator'. `admin_set_admin` guards `cannot_remove_self` and `last_admin` so the operator can never lock themselves or everyone out.
- **Advertising isolation (non-negotiable):** advertising tables hold no foreign keys into `providers`, `recommendations` or `auth.users`. Adverts cannot read reviews, reputation, rankings, provider statistics, user information or behavioural analytics. No ad networks, no programmatic, no tracking pixels, no advertiser-supplied JavaScript, no advertiser accounts. Direct local relationships only: the business sends artwork, we upload it. Every advert belongs to a **slot**, never a page. Sponsored units are labelled and linked `rel="sponsored noopener noreferrer nofollow"`. Advertising can never influence ranking or reputation.
- **House content vs featured providers:** house cards fill any unsold slot and behave like adverts mechanically (priority, targeting, rotation). Featured providers are editorial, live in a separate table with separate rendering, and are explicitly labelled as not paid placement. Keeping these two systems apart is a trust decision, not a technical one.
- **Trust ladder:** `listed → claimed → verified_business → community_trusted → verified_jobs → trusted_professional → trusted_business` (`lib/trust.js`).
- **Reputation engine:** currently simple averages (5A). Planned: 5B evidence tiers/weighting/photos (deferred), 5C Trusted Score (evidence-weighted Bayesian + Wilson) — note open contradiction with the "never a single score" principle, decide when 5C becomes real. 5D relationship timeline, 5E marketplace-verified jobs.
- **Taxonomy (built, locked):** `lib/categories.js` holds **21 groups and 141 categories**, two levels, group derived from category so there is no group column in the database. Providers hold a **primary `category_id` plus optional `secondary_categories text[]`**. Original live slugs (electrical, plumbing, ac, masonry, gardening, cleaning) are preserved. Search, filters, advertising targeting and analytics all read groups and categories from this one file. Changing the taxonomy is a deploy, never a database edit. Never build anything that assumes a flat single-category model.
- **Scalability decisions already locked:** path-based provider URLs with server-rendered metadata are the target (current query-param `/provider?id=` must eventually 301); contact email lives behind one constant (`lib/site.js`); all trust-bearing writes via RPCs so clients stay thin.

---

## 4. Workflow — BUILD MODE (important)

Discovery phase is over. **Do not generate HTML design documents unless explicitly asked.** No per-feature design docs.

Default loop: **discuss briefly in chat → identify genuine architectural decisions → ask only necessary questions (bullets in chat) → build → test → deploy → concise summary.**

Momentum over documentation. Problems are worked through in chat, one at a time: explain briefly, propose solution, get approval if needed, build. Keep changes small, scoped, and deployable. Never touch unrelated features. Think several features ahead (taxonomy, URLs, scale) so we don't paint ourselves into a corner.

---

## 5. Feature status

| Feature | Status | Note |
|---|---|---|
| F1 — Next.js migration | ✅ Completed | Live on Vercel, App Router. |
| F2 — Design system + contact gating | ✅ Completed | Contact column-gated in DB; logged-out users never see phone/WhatsApp. |
| F3 — Customer accounts | ✅ Completed | Magic-link sign-in; free profile = first name + area. Social/phone auth built but OFF. |
| F4 — Provider claiming + admin | ✅ Completed | Admin-approved claims, limited owner editing, trust ladder, admin console. |
| F5A — Structured reviews | ✅ Completed | Two-speed form, dimensions, one editable review per customer–provider. |
| "Not sure" integrity fix | ✅ Built — ⏳ pending deploy | Option removed; form is Yes/No only. Historic `false` rows need a one-time audit (can't distinguish old Not-sure clicks from real Nos). |
| Legal pages (privacy/terms/guidelines) | ✅ Live | Operator shown as "the Trusted Antigua team" (personal name removed at operator's request; company formation still pending). Contact hidden behind `lib/site.js` constant until domain email exists. Local lawyer review still outstanding. |
| Review reporting + disputes + takedown | ✅ Built — ⏳ pending deploy | `review_reports` + RPCs + admin queue. Reports never hide reviews. |
| Right of reply | ✅ Built — ⏳ pending deploy | One editable public reply per review for claimed owners; admin backstop. |
| F5B — evidence, weighting, photos | ⏸ Deferred | Deliberately postponed until real review volume exists. Design of record: `Feature-5B-Design-of-Record.md` in the Claude Project folder. |
| F5C/5D/5E — Trusted Score, timeline, verified jobs | ⏸ Deferred | Future phases. |
| Sharing/SEO/analytics | ✅ Live (sharing/SEO) | metadataBase, OG/Twitter, sitemap, robots, icon. Analytics still backlog. |
| Taxonomy (group → category) | ✅ Live | 21 groups, 141 categories, one primary + optional `secondary_categories text[]`. |
| Advertising subsystem | ✅ Live | `ad_slots` / `ad_campaigns` / `ad_creatives` / `ad_placements`. Zero FKs into providers, reviews or users. Read path is one SECURITY DEFINER function. Adverts belong to a slot, never a page. |
| House content | ✅ Live | `house_cards`, data-driven, fills any slot with no live advert. 10 seeded cards. |
| Featured providers | ✅ Live | `featured_providers`, editorial only, teal styling + "Chosen by our team. Not paid placement." Deliberately separate from advertising. |
| Admin Control Centre | ✅ Live | `/admin` dashboard overview + 8 sections (Providers, Reviews, Featured, Advertisements, House Content, Users, Categories, Site Settings). One entry point, no hidden URLs, no SQL. `AdminShell` gates every route; every admin RPC also raises `not_admin` server-side. |
| Admin roles | ✅ Live | `admins.role` ('admin' \| 'moderator'), `admin_set_admin` guards `cannot_remove_self` and `last_admin` (both verified on production 18 July 2026). |
| Google sign-in | ⏸ Blocked on config | Code path complete (`AuthProvider.oauth`). `ENABLED.google = false` until the Google Cloud OAuth client is created and the provider enabled in Supabase. Redirect URI: `https://qyvtbftapmdrxrzctunt.supabase.co/auth/v1/callback`. Magic link stays as fallback. |

---

## 6. Current backlog (prioritised)

1. **Enable Google sign-in** — operator task: create the Google Cloud OAuth client, enable the provider in Supabase, then flip `ENABLED.google = true` in `components/AuthProvider.js`, make it the primary button, keep magic link as fallback, verify existing users still sign in.
2. **Legal completion** — local lawyer review of the three legal pages (L-01–L-07 in the Decision & Legal Register); company-formation decision. (Historic would-hire-again audit: ✅ resolved, 0 rows.)
3. **Per-provider sharing** — path-based provider routes (`/provider/[id]` or slug) with server-rendered per-provider OG/meta; WhatsApp-first share button; `LocalBusiness` structured data; custom domain.
4. **Measurability** — analytics (Vercel Analytics or Plausible), funnel events (search → profile → sign-in → contact tap → review), no-results search logging, pilot metrics from the 4.7R doc (resident vs seeder, check-before-hiring).
5. **Tech debt sweep** — see §7.
6. **Taxonomy expansion** — implement group → category + primary/secondary; migrate existing categories; category landing pages (SEO surfaces).
7. **Pilot execution** — seed 20–30 known-good providers, 3+ reviews each, warm WhatsApp-group distribution, 60–90 days, measured.
8. **Reputation engine phases** — 5B thin-to-full as volume justifies, then 5C+ decisions.
9. **Marketplace future** — verified jobs, monetisation per the Monetisation Guardrails doc (never sell review removal; never damage trust for revenue).

---

## 7. Outstanding technical debt

- `recommender_display` is client-supplied to `submit_review` — must be derived server-side inside the RPC (impersonation risk). Requires editing the live function (fetch current source via `select prosrc from pg_proc where proname='submit_review'`).
- Claim security: `submitClaim`/`requestCategoryChange` are raw inserts; already-claimed and duplicate-pending checks are UI-only — add DB constraints/policies.
- Verify RLS on admin-read tables (`provider_claims`, `category_change_requests`, deleted `recommendations`) returns zero rows to non-admins; verify the providers guard trigger covers `trust_level`, `verified_at`, `name`.
- Account deletion only deletes the `profiles` row — auth user + reviews survive; UI says "can't be undone". Make deletion honest (full erasure flow or accurate copy). Privacy-policy exposure.
- Magic-link redirect always lands on home (`emailRedirectTo: window.location.origin`) — return users to the page they signed in from.
- `provider()` in `lib/data.js` swallows errors → network failure renders "Provider not found" instead of retry.
- `/find` downloads the full providers table + stats and filters in JS — fine at current scale, needs server-side filtering/pagination before ~500 providers.
- Duplicate `withTimeout` in `app/find/page.js` swallows all errors (silently hides reputation data on failure) — unify with `lib/helpers.js`.
- Phone normalisation: `waLink` doesn't validate or add the 1-268 country code; no normalisation at input. Broken `wa.me` links possible.
- Review-form prefill race (async prefill can overwrite typing); free-text review of an existing provider silently overwrites prior review while button says "Post review".
- CompleteProfile modal can flash on load and has no escape if the upsert fails.
- Label drift: "Quality of finished work" (form) vs "Finished work" (profile). Unused exports `dimCol`/`dimAvgCol` in `lib/reviews.js`. Leftover emoji in empty states/selects.
- No rate limiting on review submission, reports, or `private_warnings` inserts.
- No `app/error.js` / `not-found.js` / `loading.js`; raw `<img>` (no image optimisation); no tests; no ESLint config.
- Old MVP `mvp/` folder in the Claude Project folder is legacy — the live schema has long diverged from `mvp/schema.sql`; treat the dashboard as truth.

---

## 8. Current known issues

- **Historic would-hire-again data:** ✅ Resolved — audit run July 2026, **0** rows with `would_hire_again = false` (nothing to clean up). Re-check SQL if needed: `select id, provider_id, recommender_display, reason, created_at from recommendations where would_hire_again = false and deleted_at is null;`
- **Magic-link email** sends from Supabase's default sender — poor deliverability/branding; move to Resend + domain once the domain exists.
- **No analytics** — zero visibility into usage until backlog #4 ships.
- **WhatsApp link previews are generic** (no per-provider OG) until backlog #3 ships.
- **Supabase MCP connector cannot access this project — known Supabase limitation, not a wrong-account problem (verified).** The connector authenticates as the Gmail/GitHub account (its own "SuspectOcean's Org"). The hosted Supabase OAuth grant is **scoped to a single organization** chosen at consent (open issue [supabase/mcp #304](https://github.com/supabase/mcp/issues/304)); it does not auto-pick-up newly-joined orgs, and reconnecting still grants only one org. That account is now an Owner of the "Tourism Platform" org that owns this project, but the connector's grant remains locked to SuspectOcean's Org — and switching it to Tourism Platform would drop the other projects. **SOP: all DB work is done via the browser Supabase SQL editor (Hotmail owner dashboard login). Do not chase the connector unless there is a documented multi-org fix.** Vercel deploy is likewise done via the browser (GitHub push).
- **Cowork sandbox cannot run `npm`/Next builds** (timeouts) — rely on Vercel builds; syntax-check locally with esbuild if needed. The OneDrive-mounted folder can lag in the sandbox shell — verify file contents via the Read tool, not bash, after editing.

---

## 9. Deployment process

1. **Code:** edit files locally in the repo folder → upload to GitHub via the web UI ("Upload files" → commit to `main`, folder-by-folder at `/upload/main/<folder>`) → Vercel auto-builds. Green check = deployed; red check = read the Vercel build log. Uploads carry whatever is on disk — never commit files with unfinished imports.
2. **Database:** migrations are written as idempotent, additive SQL files in `db/` (versioned in the repo), then applied by pasting into the **Supabase SQL editor** (Dashboard → SQL Editor). The editor runs a multi-statement batch as one transaction — a failure applies nothing. Verification queries live at the bottom of each migration file.
3. **Order:** apply the DB migration **before** pushing frontend code that calls new RPCs/tables.
4. **Verify live:** logged-out checks by Claude; logged-in checks by the operator.

**⏳ PENDING DEPLOY (built July 2026, not yet live):**
- Migration: `db/2026-07-14-reports-and-replies.sql`
- Changed: `app/layout.js`, `app/provider/page.js`, `app/admin/page.js`, `app/recommend/page.js`, `lib/data.js`
- New: `app/privacy/page.js`, `app/terms/page.js`, `app/guidelines/page.js`, `components/LegalPage.js`, `lib/site.js`, `db/2026-07-14-reports-and-replies.sql`
- All files esbuild-syntax-checked. Blocked on: user sign-in to Supabase dashboard + GitHub in the browser.

---

## 10. Domain & email plan

- Custom domain to be purchased (likely `trusted-antigua.com` — **not confirmed, do not assume or publish**).
- Email structure once live: **info@** (public contact), **admin@** (internal administration), **legal@** (legal/privacy requests — alias on info@ is fine).
- **No Gmail address may ever appear anywhere in the product.** Contact details stay hidden until domain email exists: `LEGAL_EMAIL = null` in `lib/site.js` renders the fallback "Contact details will be published before the public launch." on all legal pages via the `ContactLine` component. Setting the constant activates every contact point at once.
- Once purchased: connect domain to Vercel; set up mailboxes (see §11 pattern); move transactional email (magic links) to Resend on the domain; 301 the vercel.app URL.

---

## 11. Bloomfield Yachting — reference implementation (verified July 2026)

The operator's other project; proven pattern to replicate for Trusted Antigua.

- **Registrar:** Namecheap (`bloomfield-yachting.com`).
- **DNS:** managed at Namecheap (default `registrar-servers.com` nameservers).
- **Web hosting:** Vercel (Hobby), GitHub push-to-main auto-deploy. Apex A `216.198.79.1`, `www` CNAME → `*.vercel-dns-017.com`.
- **Mailboxes:** Zoho Mail (Mail Lite, 3 licences — real mailboxes: rbloomfield@, admin@, enquiries@). IMAP `imappro.zoho.com:993`, SMTP `smtppro.zoho.com:465`.
- **Transactional:** Resend (sender `noreply@` — send-only identity, not a mailbox), used by Supabase edge functions and Supabase Auth SMTP.
- **DNS records that connect it:** MX 10/20/30 → Zoho; SPF `v=spf1 include:zoho.com include:amazonses.com ~all`; DKIM `zmail._domainkey` (Zoho) + `resend._domainkey` (Resend); DMARC `p=quarantine` with reports to admin@; zoho-verification TXT.
- Credentials are NOT recorded here by design. Never store passwords in this file.

---

## 12. Architectural principles — never forget

1. **The trust firewall is the product.** Providers never influence their rating. Disputes are a moderation request, not a delete button. Reported reviews stay visible until an admin decides. No monetisation may ever touch review integrity.
2. **All trust-bearing writes go through SECURITY DEFINER RPCs** with server-side derivation of anything a client could lie about (dispute status, display names, ownership).
3. **Design for Caribbean reality:** mobile-first, WhatsApp-first, low bandwidth, informal providers without documentation. Never require a credit card, formal business, or fast internet.
4. **Additive, idempotent migrations only.** Never destructive DDL against live data.
5. **Small shippable slices.** One coherent change, tested, deployed, verified — then stop.
6. **Don't corner the taxonomy:** everything must survive the move to group → category with primary/secondary categories.
7. **Path-based, shareable, server-rendered provider pages are the destination** — don't deepen the query-param URL dependency.
8. **Ask before deleting or overwriting any file. Never handle secret keys or enter credentials.** The anon key is public by design.
9. **Legal before growth:** no marketing push until legal pages are live and the takedown path works.
