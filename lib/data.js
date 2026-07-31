import { supabase } from "@/lib/supabase";
import { CAT, categoriesForQuery, SEARCH_STOPWORDS, groupOf } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";

// Columns safe for logged-out users (no `contact`, no `claimed_by`).
const PUBLIC_COLS =
  "id,name,alias,category_id,secondary_categories,area,status,created_at,trust_level,description,photo_url,area_scope,service_areas,verified_at";

// Search that understands everyday phrasing and Antiguan slang.
// Matches by: (1) categories implied by the query (e.g. "current man" -> electrical),
// (2) meaningful word tokens found in the provider's name/alias/area/category/description.
function filterBySearch(rows, q) {
  const t = q.toLowerCase().trim();
  const cats = categoriesForQuery(t); // e.g. ["plumbing"]
  const tokens = t
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9/+]/g, ""))
    .filter((w) => w.length >= 3 && !SEARCH_STOPWORDS.has(w));

  return rows.filter((p) => {
    const provCats = [p.category_id, ...(p.secondary_categories || [])];
    if (cats.some((c) => provCats.includes(c))) return true;
    const hay = [
      p.name,
      p.alias,
      p.area,
      p.description,
      ...provCats.flatMap((c) => [CAT[c]?.name, CAT[c]?.blurb]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (hay.includes(t)) return true; // whole-phrase match (e.g. a name)
    return tokens.some((tok) => hay.includes(tok));
  });
}

export const api = {
  // Filter by primary OR secondary category (`category`), by taxonomy `group`,
  // and/or free-text `q`. Category/group matching is done in JS so a provider is
  // matched on any of its categories (dataset is small at current scale).
  async providers({ category = "", group = "", q = "" } = {}) {
    try {
      const { data, error } = await supabase.from("providers").select(PUBLIC_COLS).order("created_at", { ascending: false });
      if (error) { console.error(error); return []; }
      let rows = data || [];
      if (category) {
        rows = rows.filter((p) => p.category_id === category || (p.secondary_categories || []).includes(category));
      }
      if (group) {
        rows = rows.filter((p) => [p.category_id, ...(p.secondary_categories || [])].some((c) => groupOf(c) === group));
      }
      if (q && q.trim()) {
        rows = filterBySearch(rows, q);
      }
      return rows;
    } catch (e) {
      console.error("providers() failed", e);
      return [];
    }
  },

  async provider(id) {
    const { data } = await supabase.from("providers").select(PUBLIC_COLS).eq("id", id).single();
    return data;
  },

  // Contact is column-gated in the DB: this only returns a value for signed-in users.
  async providerContact(id) {
    const { data, error } = await supabase.from("providers").select("contact").eq("id", id).single();
    if (error) return null;
    return data?.contact || null;
  },

  // Recommendation detail. Read through a SECURITY DEFINER RPC that never
  // returns recommender_id: reviewer identity stays server-side (anonymity),
  // while `is_mine` still lets the author manage their own review.
  // Signed-in only, enforced inside the function.
  async recommendations(providerId) {
    const { data, error } = await supabase.rpc("reviews_for_provider", { p_provider_id: providerId });
    if (error) { console.error("recommendations", error); return []; }
    return data || [];
  },

  // Public stats view — counts/percentage/tag summary, readable while logged out.
  async recCounts() {
    try {
      const { data } = await supabase.from("provider_stats").select("provider_id, rec_count, yes_count");
      const m = {};
      (data || []).forEach((r) => { m[r.provider_id] = { count: r.rec_count, yes: r.yes_count }; });
      return m;
    } catch (e) {
      console.error("recCounts() failed", e);
      return {};
    }
  },

  async providerStats(id) {
    const { data } = await supabase.from("provider_stats").select("*").eq("provider_id", id).single();
    return data || null;
  },

  // Ten-category aggregates (rating_version 2 reviews only; public view that
  // reads nothing but recommendations — ads/featured/claims cannot touch it).
  async providerRatings(id) {
    const { data } = await supabase.from("provider_ratings").select("*").eq("provider_id", id).maybeSingle();
    return data || null;
  },

  // All ten-category aggregates, keyed by provider_id — for showing a Trust Rating
  // on list/featured cards without a per-provider round-trip.
  async providerRatingsAll() {
    try {
      const { data } = await supabase.from("provider_ratings").select("provider_id, trust_pct, avg_out_of_10, r10_count");
      const m = {};
      (data || []).forEach((r) => { m[r.provider_id] = r; });
      return m;
    } catch (e) { console.error("providerRatingsAll", e); return {}; }
  },

  // Ten-category submission. Scores validated and totalled server-side.
  async submitReviewV2({ provider_id, name, category_id, area, contact, review, scores }) {
    const { data, error } = await supabase.rpc("submit_review_v2", {
      p_provider_id: provider_id || null,
      p_name: name || null,
      p_category_id: category_id || null,
      p_area: area || null,
      p_contact: contact || null,
      p_review: review || {},
      p_scores: scores || {},
    });
    if (error) throw error;
    return data;
  },

  // Look up which provider (if any) already owns a phone number. Returns public
  // directory info only { provider_id, name, alias, category_id, area } or null.
  // Powers the live duplicate check when adding a tradesperson.
  async phoneLookup(raw) {
    if (!raw || !raw.trim()) return null;
    const { data, error } = await supabase.rpc("phone_lookup", { p_raw: raw });
    if (error) { console.error("phoneLookup", error); return null; }
    return (data && data[0]) || null;
  },

  // Quick-add a tradesperson. Number is normalised + de-duplicated server-side.
  // Returns { provider_id, existing }: existing=true means the number was already
  // in the system and no new provider was created.
  async addProviderQuick({ name, category_id, area, phone, alias }) {
    const { data, error } = await supabase.rpc("add_provider_quick", {
      p_name: name,
      p_category_id: category_id,
      p_area: area || null,
      p_phone: phone,
      p_alias: alias || null,
    });
    if (error) throw error;
    return (data && data[0]) || null;
  },

  // List YOURSELF as a provider. Same phone dedupe as addProviderQuick, but a new
  // listing is created owned by the caller (claimed_by = auth.uid) and can carry
  // secondary trades. Returns { provider_id, existing }: existing=true means the
  // number is already listed — the caller should offer to CLAIM it instead.
  async listSelfProvider({ name, category_id, secondary_categories, area, phone, alias }) {
    const { data, error } = await supabase.rpc("list_self_provider", {
      p_name: name,
      p_category_id: category_id,
      p_secondary: Array.isArray(secondary_categories) ? secondary_categories : [],
      p_area: area || null,
      p_phone: phone,
      p_alias: alias || null,
    });
    if (error) throw error;
    return (data && data[0]) || null;
  },

  // Category ids that have at least one provider (primary or secondary), for the
  // "be the first to add" marking on browse surfaces.
  async populatedCategories() {
    const { data, error } = await supabase.rpc("populated_categories");
    if (error) { console.error("populatedCategories", error); return []; }
    return data || [];
  },

  // A user proposes a trade that isn't in the taxonomy yet (from the add flow).
  async suggestCategory(name, providerId) {
    const { data, error } = await supabase.rpc("suggest_category", { p_name: name, p_provider_id: providerId || null });
    if (error) throw error;
    return data;
  },
  async adminCategorySuggestions() {
    const { data, error } = await supabase.rpc("admin_category_suggestions");
    if (error) { console.error("adminCategorySuggestions", error); return []; }
    return data || [];
  },
  async adminResolveSuggestion(id, status) {
    const { error } = await supabase.rpc("admin_resolve_suggestion", { p_id: id, p_status: status });
    if (error) throw error;
    return { ok: true };
  },

  // Returns the current session (refreshing if needed) or null.
  async ensureSession() {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  },

  // Live ads for a slot. Reads ONLY display-safe fields via the SECURITY DEFINER
  // function ads_for_slot (no access to any provider/user/review data).
  async adsForSlot(slotKey) {
    try {
      const { data, error } = await supabase.rpc("ads_for_slot", { p_slot: slotKey });
      if (error) { console.error("adsForSlot", error); return []; }
      return data || [];
    } catch (e) { console.error("adsForSlot failed", e); return []; }
  },

  // Our own house content eligible for a slot (not advertising).
  async houseCardsForSlot(slotKey) {
    try {
      const { data, error } = await supabase.rpc("house_cards_for_slot", { p_slot: slotKey });
      if (error) { console.error("houseCardsForSlot", error); return []; }
      return data || [];
    } catch (e) { console.error("houseCardsForSlot failed", e); return []; }
  },

  // Editorial highlights. Deliberately separate from advertising: different table,
  // different function, never rendered as "Sponsored". Public provider fields only.
  async featuredProviders(limit = 3) {
    try {
      const { data, error } = await supabase.rpc("featured_providers_list", { p_limit: limit });
      if (error) { console.error("featuredProviders", error); return []; }
      return data || [];
    } catch (e) { console.error("featuredProviders failed", e); return []; }
  },

  // Feature 5A: atomic find-or-create provider + UPSERT the caller's structured review
  // (one review per customer-provider, editable). `review` is a plain object. Returns provider id.
  async submitReview({ provider_id, name, category_id, area, contact, review }) {
    const { data, error } = await supabase.rpc("submit_review", {
      p_provider_id: provider_id || null,
      p_name: name || null,
      p_category_id: category_id || null,
      p_area: area || null,
      p_contact: contact || null,
      p_review: review || {},
    });
    if (error) throw error;
    return data;
  },

  // The caller's existing (non-deleted) review for a provider (for edit prefill), or null.
  // Scoped to the caller inside the RPC — no user id is sent or trusted from the client.
  async myReviewForProvider(providerId /* userId no longer needed */) {
    const { data, error } = await supabase.rpc("my_review_for_provider", { p_provider_id: providerId });
    if (error) { console.error("myReviewForProvider", error); return null; }
    return (data && data[0]) || null;
  },

  // The caller's own reviews (non-deleted), with provider name/category for edit links.
  // Shaped to match the previous PostgREST embed so callers need no changes.
  async myReviews() {
    const { data, error } = await supabase.rpc("my_reviews");
    if (error) { console.error("myReviews", error); return []; }
    return (data || []).map((r) => ({
      ...r,
      providers: { name: r.provider_name, alias: r.provider_alias, category_id: r.provider_category_id },
    }));
  },

  // Customer soft-deletes their own review.
  async deleteMyReview(reviewId) {
    const { error } = await supabase.rpc("delete_my_review", { p_id: reviewId });
    if (error) throw error;
    return { ok: true };
  },

  /* ---------------- Reports, disputes & right of reply ---------------- */

  // Report a review (or, if the caller owns the provider, dispute it). Server derives dispute status.
  async reportReview(reviewId, reason, details) {
    const { data, error } = await supabase.rpc("report_review", {
      p_review_id: reviewId,
      p_reason: reason,
      p_details: details || null,
    });
    if (error) throw error;
    return data; // report id
  },

  // The caller's open reports (to show "reported — under review" on cards).
  async myOpenReports(userId) {
    const { data } = await supabase
      .from("review_reports")
      .select("review_id")
      .eq("reporter_id", userId)
      .eq("status", "open");
    return new Set((data || []).map((r) => r.review_id));
  },

  // Replies to reviews of one provider, keyed by review id. Signed-in read (matches review gating).
  async repliesForProvider(providerId) {
    const { data } = await supabase
      .from("review_replies")
      .select("review_id, body, created_at, updated_at")
      .eq("provider_id", providerId)
      .is("removed_at", null);
    const m = {};
    (data || []).forEach((r) => { m[r.review_id] = r; });
    return m;
  },

  // Claimed owner posts or edits their single public reply to a review.
  async replyToReview(reviewId, body) {
    const { data, error } = await supabase.rpc("reply_to_review", { p_review_id: reviewId, p_body: body });
    if (error) throw error;
    return data;
  },

  // Admin: open reports/disputes with review + provider context, via an
  // is_admin()-gated RPC (the previous version embedded `recommendations`,
  // which required direct client SELECT on that table).
  // Shaped to match the previous embed so the admin UI needs no changes.
  async adminReports() {
    const { data, error } = await supabase.rpc("admin_reports_list");
    if (error) { console.error("adminReports", error); return []; }
    return (data || []).map((r) => ({
      ...r,
      recommendations: {
        reason: r.review_reason,
        recommender_display: r.review_display,
        would_hire_again: r.review_would_hire_again,
        deleted_at: r.review_deleted_at,
      },
      providers: { name: r.provider_name, alias: r.provider_alias, category_id: r.provider_category_id },
    }));
  },

  async adminResolveReport(reportId, remove, note) {
    const { error } = await supabase.rpc("admin_resolve_report", { p_report_id: reportId, p_remove: remove, p_note: note || null });
    if (error) throw error;
    return { ok: true };
  },

  async adminRemoveReply(replyId, reason) {
    const { error } = await supabase.rpc("admin_remove_reply", { p_reply_id: replyId, p_reason: reason || null });
    if (error) throw error;
    return { ok: true };
  },

  // Admin: recent reviews (including deleted) for moderation, via an
  // is_admin()-gated RPC. Returns a one-way `reviewer_key` (hash) instead of
  // recommender_id so patterns are visible without exposing identities.
  // Shaped to match the previous embed so the admin UI needs no changes.
  async adminReviews() {
    const { data, error } = await supabase.rpc("admin_reviews_list");
    if (error) { console.error("adminReviews", error); return []; }
    return (data || []).map((r) => ({
      ...r,
      providers: { name: r.provider_name, alias: r.provider_alias, category_id: r.provider_category_id },
      review_replies: r.reply_id ? [{ id: r.reply_id, body: r.reply_body, removed_at: r.reply_removed_at }] : [],
    }));
  },

  async adminRemoveReview(reviewId, reason) {
    const { error } = await supabase.rpc("admin_remove_review", { p_id: reviewId, p_reason: reason || null });
    if (error) throw error;
    return { ok: true };
  },

  async adminRestoreReview(reviewId) {
    const { error } = await supabase.rpc("admin_restore_review", { p_id: reviewId });
    if (error) throw error;
    return { ok: true };
  },

  // Private concern to the team. Goes through a SECURITY DEFINER RPC: the
  // reporter is derived from the JWT (never supplied by the client), submission
  // requires a signed-in account, and the server enforces length limits,
  // duplicate suppression and a 5-per-24h rate limit.
  async addWarning({ provider_id, provider_name, warning }) {
    const { data, error } = await supabase.rpc("submit_private_warning", {
      p_provider_id: provider_id || null,
      p_provider_name: provider_name || null,
      p_warning: warning,
    });
    if (error) throw error;
    return { ok: true, id: data };
  },

  /* ---------------- Feature 4: provider claiming & management ---------------- */

  // Who owns this profile (authenticated-only column). Returns claimed_by uuid or null.
  async providerOwner(id) {
    const { data, error } = await supabase.from("providers").select("claimed_by").eq("id", id).single();
    if (error) return null;
    return data?.claimed_by || null;
  },

  // Submit a claim (enters admin approval queue as 'pending').
  async submitClaim({ provider_id, claimant_id, submitted_name, submitted_description, submitted_contact }) {
    const { error } = await supabase.from("provider_claims").insert({
      provider_id,
      claimant_id,
      submitted_name: submitted_name || null,
      submitted_description: submitted_description || null,
      submitted_contact: submitted_contact || null,
    });
    if (error) throw error;
    return { ok: true };
  },

  // A user's own claims (any status).
  async myClaims(userId) {
    const { data } = await supabase
      .from("provider_claims")
      .select("*, providers(name, alias, category_id, trust_level)")
      .eq("claimant_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  },

  // A user's most recent claim for one provider (to show pending/approved state).
  async myClaimForProvider(providerId, userId) {
    const { data } = await supabase
      .from("provider_claims")
      .select("*")
      .eq("provider_id", providerId)
      .eq("claimant_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    return (data && data[0]) || null;
  },

  // Providers this user owns (approved claims set claimed_by).
  async myManagedProviders(userId) {
    const { data } = await supabase
      .from("providers")
      .select("id,name,alias,category_id,area,trust_level,photo_url,description,area_scope,service_areas,contact")
      .eq("claimed_by", userId)
      .order("created_at", { ascending: false });
    return data || [];
  },

  // One provider with owner-editable fields (owner/admin use).
  async manageProvider(id) {
    const { data } = await supabase
      .from("providers")
      .select("id,name,alias,category_id,secondary_categories,area,trust_level,photo_url,description,area_scope,service_areas,contact,claimed_by")
      .eq("id", id)
      .single();
    return data || null;
  },

  // Owner updates whitelisted public fields. Protected columns are blocked at the DB.
  async updateProfile(id, patch) {
    const { error } = await supabase.from("providers").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  async requestCategoryChange({ provider_id, requester_id, current_category, requested_category }) {
    const { error } = await supabase.from("category_change_requests").insert({
      provider_id,
      requester_id,
      current_category: current_category || null,
      requested_category,
    });
    if (error) throw error;
    return { ok: true };
  },

  async myCategoryRequest(providerId, userId) {
    const { data } = await supabase
      .from("category_change_requests")
      .select("*")
      .eq("provider_id", providerId)
      .eq("requester_id", userId)
      .eq("status", "pending")
      .limit(1);
    return (data && data[0]) || null;
  },

  // Upload a photo to Storage; returns the public URL.
  //
  // Layers of defence, in order of trustworthiness:
  //  1. DB trigger  — rate limit (20/24h per user), cannot be bypassed.
  //  2. Bucket      — allowed MIME types + 2 MB cap, enforced by the Storage API.
  //  3. RLS policy  — you may only write inside your own folder.
  //  4. This code   — decodes the file as an actual image before uploading and
  //                   derives the extension from the REAL type, never from the
  //                   supplied filename. A client check is bypassable by anyone
  //                   scripting the API directly, so it exists to catch honest
  //                   mistakes and give a clear error, not as a security control.
  async uploadPhoto(file, userId) {
    const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const MAX_BYTES = 2 * 1024 * 1024;

    if (!file) throw new Error("no_file");
    if (file.size > MAX_BYTES) throw new Error("file_too_large");
    if (!ALLOWED[file.type]) throw new Error("unsupported_file_type");

    // Prove it really is a decodable image, not something renamed to .jpg.
    try {
      if (typeof createImageBitmap === "function") {
        const bmp = await createImageBitmap(file);
        if (!bmp || !bmp.width || !bmp.height) throw new Error("not_an_image");
        if (bmp.close) bmp.close();
      }
    } catch {
      throw new Error("not_an_image");
    }

    // Extension comes from the verified type, so a disguised name can't set it.
    const ext = ALLOWED[file.type];
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("provider-photos")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
    if (error) {
      if (/rate_limited/i.test(error.message || "")) throw new Error("upload_rate_limited");
      throw error;
    }
    const { data } = supabase.storage.from("provider-photos").getPublicUrl(path);
    return data.publicUrl;
  },

  /* ---------------- Admin ---------------- */

  async isAdmin() {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) return false;
    return !!data;
  },

  async adminClaims(status = "pending") {
    let q = supabase
      .from("provider_claims")
      .select("*, providers(name, alias, category_id, trust_level, claimed_by)")
      .eq("kind", "claim")
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return data || [];
  },

  async adminDecideClaim(claimId, approve, note) {
    const { error } = await supabase.rpc("admin_decide_claim", { p_claim_id: claimId, p_approve: approve, p_note: note || null });
    if (error) throw error;
    return { ok: true };
  },

  async adminSetTrust(providerId, level) {
    const { error } = await supabase.rpc("admin_set_trust_level", { p_provider_id: providerId, p_level: level });
    if (error) throw error;
    return { ok: true };
  },

  async adminRevoke(providerId) {
    const { error } = await supabase.rpc("admin_revoke_claim", { p_provider_id: providerId });
    if (error) throw error;
    return { ok: true };
  },

  async adminCategoryRequests(status = "pending") {
    let q = supabase
      .from("category_change_requests")
      .select("*, providers(name, alias)")
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return data || [];
  },

  async adminDecideCategory(reqId, approve, note) {
    const { error } = await supabase.rpc("admin_decide_category", { p_req_id: reqId, p_approve: approve, p_note: note || null });
    if (error) throw error;
    return { ok: true };
  },

  /* ---------------- Admin: dashboard, roles, content management ---------------- */

  async adminOverview() {
    const { data, error } = await supabase.rpc("admin_overview");
    if (error) { console.error("adminOverview", error); return null; }
    return (data && data[0]) || null;
  },

  async adminListUsers() {
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) { console.error("adminListUsers", error); return []; }
    return data || [];
  },

  // Guarded server-side: cannot remove yourself or the last admin.
  async adminSetAdmin(userId, make, role = "admin") {
    const { error } = await supabase.rpc("admin_set_admin", { p_user: userId, p_make: make, p_role: role });
    if (error) throw error;
    return { ok: true };
  },

  // --- Invitations (owner invites by email; role attaches at sign-in) ---
  async adminInviteRole(email, role) {
    const { data, error } = await supabase.rpc("admin_invite_role", { p_email: email, p_role: role });
    if (error) throw error;
    return data;
  },
  // Emails the invitee an ordinary magic-link sign-in (via the live Resend SMTP).
  // Deliberately carries NO role or token: the role is attached server-side from the
  // pending invitation record when this email signs in. The link alone grants nothing.
  async sendSignInLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: SITE_URL },
    });
    if (error) throw error;
    return { ok: true };
  },
  async adminRevokeInvitation(id) {
    const { error } = await supabase.rpc("admin_revoke_invitation", { p_id: id });
    if (error) throw error;
    return { ok: true };
  },
  async adminInvitations() {
    const { data, error } = await supabase.rpc("admin_list_invitations");
    if (error) { console.error("adminInvitations", error); return []; }
    return data || [];
  },
  async adminAuditLog() {
    const { data, error } = await supabase.rpc("admin_audit_log");
    if (error) { console.error("adminAuditLog", error); return []; }
    return data || [];
  },

  // --- Featured providers (editorial) ---
  async adminFeatured() {
    const { data } = await supabase
      .from("featured_providers")
      .select("*, providers(name, alias, category_id, area)")
      .order("priority", { ascending: false });
    return data || [];
  },
  async adminSaveFeatured(row) {
    const { error } = row.id
      ? await supabase.from("featured_providers").update(row).eq("id", row.id)
      : await supabase.from("featured_providers").insert(row);
    if (error) throw error;
    return { ok: true };
  },
  async adminDeleteFeatured(id) {
    const { error } = await supabase.from("featured_providers").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  // --- House content ---
  async adminHouseCards() {
    const { data } = await supabase.from("house_cards").select("*").order("priority", { ascending: false });
    return data || [];
  },
  async adminSaveHouseCard(row) {
    const { error } = row.id
      ? await supabase.from("house_cards").update(row).eq("id", row.id)
      : await supabase.from("house_cards").insert(row);
    if (error) throw error;
    return { ok: true };
  },
  async adminDeleteHouseCard(id) {
    const { error } = await supabase.from("house_cards").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  // --- Advertising ---
  async adminAdSlots() {
    const { data } = await supabase.from("ad_slots").select("*").order("sort");
    return data || [];
  },
  async adminCampaigns() {
    const { data } = await supabase
      .from("ad_campaigns")
      .select("*, ad_creatives(*), ad_placements(*)")
      .order("created_at", { ascending: false });
    return data || [];
  },
  async adminSaveCampaign(row) {
    if (row.id) {
      const { error } = await supabase.from("ad_campaigns").update(row).eq("id", row.id);
      if (error) throw error;
      return row.id;
    }
    const { data, error } = await supabase.from("ad_campaigns").insert(row).select("id").single();
    if (error) throw error;
    return data.id;
  },
  async adminDeleteCampaign(id) {
    const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
  async adminSaveCreative(row) {
    const { error } = row.id
      ? await supabase.from("ad_creatives").update(row).eq("id", row.id)
      : await supabase.from("ad_creatives").insert(row);
    if (error) throw error;
    return { ok: true };
  },
  async adminDeleteCreative(id) {
    const { error } = await supabase.from("ad_creatives").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
  async adminSavePlacement(row) {
    const { error } = row.id
      ? await supabase.from("ad_placements").update(row).eq("id", row.id)
      : await supabase.from("ad_placements").insert(row);
    if (error) throw error;
    return { ok: true };
  },
  async adminDeletePlacement(id) {
    const { error } = await supabase.from("ad_placements").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  // Creative images live in their own bucket; storage RLS restricts writes to admins.
  async adminUploadAdImage(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("ad-creatives").upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabase.storage.from("ad-creatives").getPublicUrl(path);
    return data.publicUrl;
  },
};
