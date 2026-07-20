import { supabase } from "@/lib/supabase";
import { CAT, categoriesForQuery, SEARCH_STOPWORDS, groupOf } from "@/lib/categories";

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

  // Recommendation detail — RLS restricts this to signed-in users.
  async recommendations(providerId) {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .eq("provider_id", providerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
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
  async myReviewForProvider(providerId, userId) {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .eq("provider_id", providerId)
      .eq("recommender_id", userId)
      .is("deleted_at", null)
      .limit(1);
    return (data && data[0]) || null;
  },

  // The caller's own reviews (non-deleted), with provider name/category for edit links.
  async myReviews(userId) {
    const { data } = await supabase
      .from("recommendations")
      .select("*, providers(name, alias, category_id)")
      .eq("recommender_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return data || [];
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

  // Admin: open reports/disputes with review + provider context.
  async adminReports() {
    const { data } = await supabase
      .from("review_reports")
      .select("*, recommendations(reason, recommender_display, would_hire_again, deleted_at), providers(name, alias, category_id)")
      .eq("status", "open")
      .order("created_at", { ascending: true });
    return data || [];
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

  // Admin: recent reviews (including deleted) for moderation.
  async adminReviews() {
    const { data } = await supabase
      .from("recommendations")
      .select("*, providers(name, alias, category_id), review_replies(id, body, removed_at)")
      .order("created_at", { ascending: false })
      .limit(100);
    return data || [];
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

  async addWarning({ provider_id, provider_name, warning }) {
    const { error } = await supabase
      .from("private_warnings")
      .insert({ provider_id: provider_id || null, provider_name: provider_name || null, warning });
    if (error) throw error;
    return { ok: true };
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
      .select("id,name,alias,category_id,area,trust_level,photo_url,description,area_scope,service_areas,contact,claimed_by")
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

  // Upload a profile photo to Storage; returns the public URL.
  async uploadPhoto(file, userId) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("provider-photos").upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
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
