import { supabase } from "@/lib/supabase";
import { CAT } from "@/lib/categories";

// Faithful port of the current MVP's data layer (same tables, same logic).
export const api = {
  async providers({ category = "", q = "" } = {}) {
    let query = supabase.from("providers").select("*").order("created_at", { ascending: false });
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
    const { data } = await supabase.from("providers").select("*").eq("id", id).single();
    return data;
  },

  async recommendations(providerId) {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });
    return data || [];
  },

  async recCounts() {
    const { data } = await supabase.from("recommendations").select("provider_id, would_hire_again");
    const m = {};
    (data || []).forEach((r) => {
      const o = m[r.provider_id] || (m[r.provider_id] = { count: 0, yes: 0 });
      o.count++;
      if (r.would_hire_again) o.yes++;
    });
    return m;
  },

  async findOrCreateProvider({ name, category_id, area, contact }) {
    const { data: existing } = await supabase
      .from("providers")
      .select("*")
      .ilike("name", name.trim())
      .eq("category_id", category_id)
      .limit(1);
    if (existing && existing.length) return existing[0];
    const { data, error } = await supabase
      .from("providers")
      .insert({ name: name.trim(), category_id, area: area || null, contact: contact || null })
      .select()
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
