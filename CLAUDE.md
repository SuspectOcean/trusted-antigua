# Trusted Antigua — Project Context (CLAUDE.md)

This file lets any Claude chat (or developer) understand the project and continue safely. Read it fully before making changes.

---

## What Trusted Antigua is

A trusted directory and reputation platform for tradespeople and home-service providers in **Antigua & Barbuda** — electricians, plumbers, AC techs, masons, gardeners, cleaners, etc. Residents find, compare, and review local providers. Think Checkatrade/Trustpilot adapted for the Caribbean reality (mobile-first, WhatsApp-first, many informal sole traders).

Guiding principle (locked): **"You control how you're described. The community controls how you're rated."**

---

## Stack

- **Frontend:** Next.js 14.2.15 (App Router, JavaScript — not TypeScript), React 18.3.1, Tailwind CSS 3.4.13. Dark-first theme, warm amber accent. `@/*` path alias → repo root.
- **Backend:** Supabase (Postgres + Auth + Row-Level Security + Storage). Client uses the **publishable/anon key** only (safe to be public); all protection is enforced by RLS, column grants, `SECURITY DEFINER` functions, and triggers.
- **Hosting:** Vercel (Hobby). GitHub → Vercel auto-deploy on push to `main`.
- **Repo:** https://github.com/SuspectOcean/trusted-antigua  (repo root = the Next.js app root; `app/`, `components/`, `lib/` at top level)
- **Live URL:** https://trusted-antigua.vercel.app
- **Supabase project ref:** `qyvtbftapmdrxrzctunt` (dashboard: supabase.com/dashboard/project/qyvtbftapmdrxrzctunt). Purpose: stores providers, reviews, customer/provider accounts, claims, and reputation aggregates for the platform.

---

## Repo layout (key files)

- `app/` — routes: `/` (home), `/find` (search+filter), `/provider` (profile), `/recommend` (review form), `/account`, `/claim`, `/manage`, `/admin`.
- `components/` — `AuthProvider.js` (auth context + sign-in sheet), `BottomNav.js`, `ProviderCard.js`, `TrustBadge.js`, `CategoryIcon.js`.
- `lib/` — `supabase.js` (client), `data.js` (all DB access — the API layer), `categories.js` (trades, areas, search synonyms), `reviews.js` (review dimensions, work-types, timeframes), `trust.js` (trust ladder), `helpers.js` (`pct`, `waLink`, `withTimeout`).

---

## Current feature status

- **Feature 1 — Next.js migration:** done.
- **Feature 2 — Design system + contact gating:** done. Logged-out users cannot see phone/WhatsApp; contact is column-gated in the DB.
- **Feature 3 — Customer accounts:** done. Email **magic-link** sign-in (Google/Facebook/phone are built but OFF pending external config — flags in `AuthProvider.js`). Free profile = first name + area. Reviews/contact gated behind sign-in.
- **Feature 4 — Provider claiming + admin:** done. Providers claim their profile (admin-approved), edit limited public fields, get a "Verified Business" badge. Trust ladder: `listed → claimed → verified_business → community_trusted → verified_jobs → trusted_professional → trusted_business`. Admin console at `/admin`.
- **Feature 5A — Structured reviews (foundation):** done/live. Two-speed review form: fast (would-hire-again + finished-work + tags) or full (six 0–10 dimensions — finished work, reliability, punctuality, communication, value for money, professionalism — plus optional cleanliness/problem-solving/speed, work-type tags, timeframe bucket). **One review per customer–provider, editable.** Profile shows would-hire-again %, review count, households served, and a **"Building reputation"** state until enough scored reviews exist (threshold = 3 in `lib/reviews.js`), then per-dimension averages.
- **Feature 5B — NEXT (designed, not built):** evidence + additive weighting + provider confirmation + moderation.
- **5C / 5D / 5E — future:** Trusted Score (evidence-weighted Bayesian + Wilson would-hire-again), living relationship timeline, marketplace-verified jobs. Design docs live in the Claude Project folder, not the repo.

---

## Build workflow (follow strictly)

**Design → Approval → Build → Test → Deploy → Stop.**

For every feature: write a plain-English product design first (no code), get explicit approval, build only the approved scope, test (happy paths, errors, edge cases, mobile, security), deploy, verify live, then **stop and wait** for approval before the next feature.

Features are split into the smallest safe, independently shippable phases (e.g., 5A, 5B, 5C…). Do not build the whole reputation engine at once.

---

## Important rules

- **Do not change unrelated features.** Keep each change minimal and scoped.
- **Preserve the trust firewall:** providers can NEVER edit, hide, delete, reorder, or down-weight reviews/recommendations. This is enforced server-side (RLS + `BEFORE UPDATE` guard trigger on `providers`; `recommendations` has no UPDATE/DELETE policy). Providers may only reply/confirm (future) and edit their own description/photo/areas.
- **Reputation is community-owned.** Counts, %, ratings, and quality signals derive from reviews and are read-only to providers.
- **Keep changes small and deployable.** One coherent slice at a time.
- **Test before deploy.** Verify DB changes with rolled-back simulations; verify UI logged-out live; the user does logged-in verification.
- **Never handle secret tokens/keys or enter credentials.** The anon key is public; service-role keys and passwords are off-limits.

---

## How deployment works

1. The GitHub repo is connected to Vercel; **any push to `main` triggers an automatic build + deploy.**
2. In the current Cowork setup, files are edited locally and **uploaded to GitHub via the browser** (GitHub "Upload files" → commit), folder-by-folder (`/upload/main/<folder>`). A build then runs on Vercel.
3. **Supabase/DB changes** are applied through the **Supabase SQL editor** in the browser (the Supabase MCP does not have access to this project — see limitations). Use additive, idempotent migrations; test with rolled-back `DO` blocks before relying on them.
4. After deploy, check the commit's check status (green = build passed). A red check usually means a build error (e.g., a missing import) — read the Vercel build log and fix. **Uploads carry whatever is on disk, so avoid committing files with unfinished/local-only imports.**

---

## Known limitations

- Only **email magic-link** auth is enabled; Google/Facebook/phone are built but off.
- Reputation in 5A is **simple averages** (no evidence weighting yet — that arrives in 5B/5C).
- **Full auth-user deletion** is a fast-follow (delete currently removes the profile + signs out).
- A **visual design pass** (custom `CategoryIcon`, `font-display`) is partially deployed; some pages still use emoji. `font-display` must be defined in `tailwind.config.js` or those headings fall back to the default font.
- The **Supabase and Vercel MCP connectors do not have access to this specific project** (it lives under a different account), so DB and deploy are done via the browser, not those MCPs.
- The **sandbox shell cannot run `npm`/Next builds** reliably (timeouts); rely on Vercel to build.

---

## Current next feature

**Feature 5B — Evidence, weighting, provider confirmation, moderation.** Design is approved in principle; produce/confirm the 5B step design, then build only that slice.
