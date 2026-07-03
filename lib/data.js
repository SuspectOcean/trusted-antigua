import { supabase } from "@/lib/supabase";
import { CAT } from "@/lib/categories";

// Columns safe for logged-out users (no `contact`).
const PUBLIC_COLS = "id,name,alias,category_id,area,status,created_at";

export const api = {
  async providers({ category = "", q = "" } = {}) {
    let query = supabase.from("providers").select(PUBLIC_COLS).order("created_at", { ascending: false });
    if (category) query = query.eq("category_id", category);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    let rows = data || [];
    if (q) {
      const t = q.toLowerCase();
      rows = rows.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(t) ||
          (p.alias || "").toLowerCase().includes(t) ||
          (CAT[p.category_id]?.name || "").toLowerCase().includes(t) ||
          (p.area || "").toLowerCase().includes(t)
      );
    }
    return rows;
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
      .order("created_at", { ascending: false });
    return data || [];
  },

  // Public stats view — counts/percentage/tag summary, readable while logged out.
  async recCounts() {
    const { data } = await supabase.from("provider_stats").select("provider_id, rec_count, yes_count");
    const m = {};
    (data || []).forEach((r) => { m[r.provider_id] = { count: r.rec_count, yes: r.yes_count }; });
    return m;
  },

  async providerStats(id) {
    const { data } = await supabase.from("provider_stats").select("*").eq("provider_id", id).single();
    return data || null;
  },

  async findOrCreateProvider({ name, category_id, area, contact }) {
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .ilike("name", name.trim())
      .eq("category_id", category_id)
      .limit(1);
    if (existing && existing.length) return existing[0];
    const { data, error } = await supabase
      .from("providers")
      .insert({ name: name.trim(), category_id, area: area || null, contact: contact || null })
      .select("id")
      .single();
    if (error) throw error;
    return data;
  },

  async addRecommendation(payload) {
    const { error } = await supabase.from("recommendations").insert(payload);
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
};
