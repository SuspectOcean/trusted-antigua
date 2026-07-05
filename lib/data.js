import { supabase } from "@/lib/supabase";
import { CAT, categoriesForQuery, SEARCH_STOPWORDS } from "@/lib/categories";

// Columns safe for logged-out users (no `contact`, no `claimed_by`).
const PUBLIC_COLS =
  "id,name,alias,category_id,area,status,created_at,trust_level,description,photo_url,area_scope,service_areas,verified_at";

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
    if (cats.includes(p.category_id)) return true;
    const hay = [
      p.name,
      p.alias,
      p.area,
      p.description,
      CAT[p.category_id]?.name,
      CAT[p.category_id]?.blurb,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (hay.includes(t)) return true; // whole-phrase match (e.g. a name)
    return tokens.some((tok) => hay.includes(tok));
  });
}

export const api = {
  async providers({ category = "", q = "" } = {}) {
    try {
      let query = supabase.from("providers").select(PUBLIC_COLS).order("created_at", { ascending: false });
      if (category) query = query.eq("category_id", category);
      const { data, error } = await query;
      if (error) { console.error(error); return []; }
      let rows = data || [];
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

  // Atomic: find-or-create the provider AND insert the recommendation in ONE transaction,
  // using the server's auth.uid(). No partial writes, no orphan providers. Returns provider id.
  async submitRecommendation(p) {
    const { data, error } = await supabase.rpc("submit_recommendation", {
      p_provider_id: p.provider_id || null,
      p_name: p.name || null,
      p_category_id: p.category_id || null,
      p_area: p.area || null,
      p_contact: p.contact || null,
      p_recommender_display: p.recommender_display || null,
      p_reason: p.reason || null,
      p_job_type: p.job_type || null,
      p_would_hire_again: !!p.would_hire_again,
      p_reliable: !!p.reliable,
      p_punctual: !!p.punctual,
      p_communication: !!p.communication,
      p_fair_price: !!p.fair_price,
    });
    if (error) throw error;
    return data; // provider id
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

  // Admin: recent reviews (including deleted) for moderation.
  async adminReviews() {
    const { data } = await supabase
      .from("recommendations")
      .select("*, providers(name, alias, category_id)")
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
};
