/* Trusted Antigua — MVP app (vanilla JS SPA + Supabase) */
(function () {
  "use strict";

  // ---------- Categories (launch set: home services) ----------
  const CATEGORIES = [
    { id: "electrical", name: "Electrical", emoji: "⚡", blurb: "Wiring, faults, fittings, panels" },
    { id: "plumbing", name: "Plumbing", emoji: "🚿", blurb: "Leaks, pipes, tanks, fixtures" },
    { id: "ac", name: "AC / Refrigeration", emoji: "❄️", blurb: "Air-con, fridges, cold rooms" },
    { id: "masonry", name: "Masonry / Building", emoji: "🧱", blurb: "Block, concrete, construction" },
    { id: "gardening", name: "Gardening / Landscaping", emoji: "🌿", blurb: "Yards, lawns, planting" },
    { id: "cleaning", name: "Cleaning", emoji: "🧽", blurb: "Homes, deep cleans, turnovers" },
  ];
  const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  // ---------- Demo/sample data (used until Supabase is connected) ----------
  const SEED_PROVIDERS = [
    { id: "s1", name: "Ricky Joseph", alias: "Ricky the AC Man", category_id: "ac", area: "St John's", contact: "+1 268 700 0001" },
    { id: "s2", name: "Delroy Samuel", alias: "", category_id: "electrical", area: "All Saints", contact: "+1 268 700 0002" },
    { id: "s3", name: "Marva's Home Cleaning", alias: "Marva", category_id: "cleaning", area: "Jolly Harbour", contact: "+1 268 700 0003" },
    { id: "s4", name: "Nigel Roberts", alias: "Nigel the plumber", category_id: "plumbing", area: "St John's", contact: "+1 268 700 0004" },
    { id: "s5", name: "Elton Christian", alias: "", category_id: "masonry", area: "Liberta", contact: "" },
    { id: "s6", name: "Junior's Yard Care", alias: "Junior", category_id: "gardening", area: "English Harbour", contact: "+1 268 700 0006" },
  ];
  const SEED_RECS = [
    { provider_id: "s1", recommender_display: "A homeowner in St John's", reason: "Fixed my AC the same day, fair price.", job_type: "AC repair", would_hire_again: true, reliable: true, punctual: true, communication: true, fair_price: true },
    { provider_id: "s1", recommender_display: "Villa manager", reason: "Services all our units, always reliable.", job_type: "AC servicing", would_hire_again: true, reliable: true, punctual: true, communication: true, fair_price: false },
    { provider_id: "s2", recommender_display: "A resident", reason: "Rewired my kitchen neatly and safely.", job_type: "Rewiring", would_hire_again: true, reliable: true, punctual: false, communication: true, fair_price: true },
    { provider_id: "s3", recommender_display: "Homeowner, Jolly Harbour", reason: "Spotless work, trustworthy in the home.", job_type: "Deep clean", would_hire_again: true, reliable: true, punctual: true, communication: true, fair_price: true },
    { provider_id: "s4", recommender_display: "A resident", reason: "Sorted a bad leak quickly.", job_type: "Leak repair", would_hire_again: true, reliable: true, punctual: true, communication: false, fair_price: true },
    { provider_id: "s6", recommender_display: "English Harbour resident", reason: "Keeps the yard looking great every visit.", job_type: "Garden upkeep", would_hire_again: true, reliable: true, punctual: true, communication: true, fair_price: true },
  ];

  // ---------- Supabase ----------
  const cfg = window.TA_CONFIG || {};
  const LIVE = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let sb = null;
  if (LIVE && window.supabase) {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  if (!LIVE) {
    const b = document.getElementById("demoBanner");
    if (b) b.classList.remove("hidden");
  }

  // ---------- Data layer ----------
  const api = {
    async providers({ category = "", q = "" } = {}) {
      if (LIVE) {
        let query = sb.from("providers").select("*").order("created_at", { ascending: false });
        if (category) query = query.eq("category_id", category);
        const { data, error } = await query;
        if (error) { console.error(error); return []; }
        let rows = data || [];
        if (q) {
          const t = q.toLowerCase();
          rows = rows.filter(p => (p.name || "").toLowerCase().includes(t) || (p.alias || "").toLowerCase().includes(t) || (CAT[p.category_id]?.name || "").toLowerCase().includes(t) || (p.area || "").toLowerCase().includes(t));
        }
        return rows;
      }
      let rows = SEED_PROVIDERS.slice();
      if (category) rows = rows.filter(p => p.category_id === category);
      if (q) { const t = q.toLowerCase(); rows = rows.filter(p => (p.name+" "+p.alias+" "+(CAT[p.category_id]?.name||"")+" "+p.area).toLowerCase().includes(t)); }
      return rows;
    },
    async provider(id) {
      if (LIVE) { const { data } = await sb.from("providers").select("*").eq("id", id).single(); return data; }
      return SEED_PROVIDERS.find(p => p.id === id);
    },
    async recommendations(providerId) {
      if (LIVE) { const { data } = await sb.from("recommendations").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }); return data || []; }
      return SEED_RECS.filter(r => r.provider_id === providerId);
    },
    async recCounts() {
      // returns { providerId: {count, yes} }
      if (LIVE) {
        const { data } = await sb.from("recommendations").select("provider_id, would_hire_again");
        const m = {}; (data || []).forEach(r => { const o = m[r.provider_id] || (m[r.provider_id] = { count: 0, yes: 0 }); o.count++; if (r.would_hire_again) o.yes++; });
        return m;
      }
      const m = {}; SEED_RECS.forEach(r => { const o = m[r.provider_id] || (m[r.provider_id] = { count: 0, yes: 0 }); o.count++; if (r.would_hire_again) o.yes++; });
      return m;
    },
    async findOrCreateProvider({ name, category_id, area, contact }) {
      if (!LIVE) return { id: "demo", name };
      const { data: existing } = await sb.from("providers").select("*").ilike("name", name.trim()).eq("category_id", category_id).limit(1);
      if (existing && existing.length) return existing[0];
      const { data, error } = await sb.from("providers").insert({ name: name.trim(), category_id, area: area || null, contact: contact || null }).select().single();
      if (error) throw error;
      return data;
    },
    async addRecommendation(payload) {
      if (!LIVE) return { demo: true };
      const { error } = await sb.from("recommendations").insert(payload);
      if (error) throw error;
      return { ok: true };
    },
    async addWarning({ provider_id, provider_name, warning }) {
      if (!LIVE) return { demo: true };
      const { error } = await sb.from("private_warnings").insert({ provider_id: provider_id || null, provider_name: provider_name || null, warning });
      if (error) throw error; // note: warnings are insert-only; not readable by public
      return { ok: true };
    },
  };

  // ---------- Helpers ----------
  const el = document.getElementById("app");
  const esc = s => (s == null ? "" : String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const waLink = c => { if (!c) return ""; const digits = String(c).replace(/[^\d]/g, ""); return "https://wa.me/" + digits; };
  const pct = (yes, count) => count ? Math.round((yes / count) * 100) : 0;
  function setTab(name) { document.querySelectorAll(".tab").forEach(a => { const on = a.dataset.tab === name; a.classList.toggle("text-teal", on); a.classList.toggle("text-navy/60", !on); a.classList.toggle("font-semibold", on); }); }
  function loading() { el.innerHTML = `<div class="flex justify-center py-16"><svg class="spin text-teal" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg></div>`; }

  function providerCard(p, counts) {
    const c = counts[p.id] || { count: 0, yes: 0 };
    const cat = CAT[p.category_id];
    const wha = pct(c.yes, c.count);
    return `<a href="#/provider/${encodeURIComponent(p.id)}" class="block bg-white rounded-2xl p-4 card-shadow active:scale-[.99] transition">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="font-semibold text-navy truncate">${esc(p.alias || p.name)}</div>
          ${p.alias ? `<div class="text-xs text-ink/50 truncate">${esc(p.name)}</div>` : ""}
          <div class="mt-1 text-[13px] text-ink/70">${cat ? cat.emoji + " " + esc(cat.name) : ""}${p.area ? ` · ${esc(p.area)}` : ""}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-[15px] font-bold text-teal">${c.count}</div>
          <div class="text-[10px] uppercase tracking-wide text-ink/50">rec${c.count === 1 ? "" : "s"}</div>
        </div>
      </div>
      ${c.count ? `<div class="mt-2 flex items-center gap-1.5 text-[12px]"><span class="text-green-700">👍 ${wha}% would hire again</span></div>` : `<div class="mt-2 text-[12px] text-ink/40">New — no recommendations yet</div>`}
    </a>`;
  }

  // ---------- Views ----------
  async function home() {
    setTab("home");
    const counts = await api.recCounts();
    const catCards = CATEGORIES.map(c => `
      <a href="#/directory?cat=${c.id}" class="bg-white rounded-2xl p-3 card-shadow flex items-center gap-3 active:scale-[.99] transition">
        <span class="text-2xl">${c.emoji}</span>
        <span class="min-w-0"><span class="block font-semibold text-navy text-[14px] leading-tight">${c.name}</span><span class="block text-[11px] text-ink/50 truncate">${c.blurb}</span></span>
      </a>`).join("");
    el.innerHTML = `
      <section class="text-center pt-2 pb-4">
        <h1 class="text-2xl font-extrabold text-navy leading-tight">Find tradespeople<br>you can trust</h1>
        <p class="mt-2 text-[14px] text-ink/70">Honest recommendations from real Antigua &amp; Barbuda residents — so you know who's reliable before you spend.</p>
      </section>
      <form id="searchForm" class="relative mb-5">
        <input id="searchInput" type="search" inputmode="search" placeholder="What do you need? e.g. electrician, AC man"
          class="w-full rounded-full border border-black/10 bg-white pl-11 pr-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal/40">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
      </form>
      <div class="flex items-center justify-between mb-2"><h2 class="font-bold text-navy">Browse by category</h2></div>
      <div class="grid grid-cols-2 gap-2.5">${catCards}</div>
      <div class="mt-6 bg-navy text-white rounded-2xl p-4">
        <h3 class="font-semibold">Know someone good?</h3>
        <p class="text-[13px] text-white/80 mt-1">Recommending a tradesperson takes 20 seconds and helps your whole community spend wisely.</p>
        <a href="#/recommend" class="inline-block mt-3 bg-gold text-white font-semibold text-sm px-4 py-2 rounded-full">Recommend someone</a>
      </div>
      <div class="mt-6 bg-white rounded-2xl p-4 card-shadow">
        <h3 class="font-semibold text-navy text-[15px]">What is Trusted Antigua?</h3>
        <p class="text-[13px] text-ink/70 mt-1">A simple, community-built list of honest, reliable home-service providers across Antigua &amp; Barbuda. Recommendations are public. Concerns are shared privately with us for review — we never post public attacks on anyone.</p>
      </div>
      <div class="h-4"></div>`;
    const f = document.getElementById("searchForm");
    f.addEventListener("submit", e => { e.preventDefault(); const q = document.getElementById("searchInput").value.trim(); location.hash = "#/directory?q=" + encodeURIComponent(q); });
  }

  async function directory(params) {
    setTab("directory");
    loading();
    const cat = params.get("cat") || "";
    const q = params.get("q") || "";
    const [rows, counts] = await Promise.all([api.providers({ category: cat, q }), api.recCounts()]);
    const chips = CATEGORIES.map(c => `<a href="#/directory?cat=${c.id}" class="whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full border ${cat===c.id?'bg-teal text-white border-teal':'bg-white text-navy border-black/10'}">${c.emoji} ${c.name}</a>`).join("");
    const title = cat ? `${CAT[cat]?.emoji||""} ${CAT[cat]?.name||""}` : (q ? `Results for "${esc(q)}"` : "All providers");
    el.innerHTML = `
      <form id="dSearch" class="relative mb-3">
        <input id="dInput" type="search" value="${esc(q)}" placeholder="Search name, trade or area"
          class="w-full rounded-full border border-black/10 bg-white pl-11 pr-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal/40">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
      </form>
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">${cat?`<a href="#/directory" class="whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full bg-navy text-white">✕ Clear</a>`:""}${chips}</div>
      <h2 class="font-bold text-navy mt-1 mb-2">${title} <span class="text-ink/40 font-normal">(${rows.length})</span></h2>
      <div class="space-y-2.5">${rows.length ? rows.map(p => providerCard(p, counts)).join("") : emptyState(cat, q)}</div>
      <div class="h-4"></div>`;
    const f = document.getElementById("dSearch");
    f.addEventListener("submit", e => { e.preventDefault(); location.hash = "#/directory?q=" + encodeURIComponent(document.getElementById("dInput").value.trim()); });
  }

  function emptyState(cat, q) {
    return `<div class="bg-white rounded-2xl p-6 text-center card-shadow">
      <div class="text-3xl mb-2">🔍</div>
      <p class="text-[14px] text-ink/70">No providers listed here yet.</p>
      <p class="text-[13px] text-ink/50 mt-1">Know someone reliable? Be the first to recommend them.</p>
      <a href="#/recommend" class="inline-block mt-3 bg-teal text-white font-semibold text-sm px-4 py-2 rounded-full">Recommend someone</a>
    </div>`;
  }

  async function providerView(id) {
    setTab("");
    loading();
    const p = await api.provider(id);
    if (!p) { el.innerHTML = `<div class="py-16 text-center text-ink/60">Provider not found. <a class="text-teal underline" href="#/directory">Back to directory</a></div>`; return; }
    const recs = await api.recommendations(id);
    const count = recs.length;
    const yes = recs.filter(r => r.would_hire_again).length;
    const wha = pct(yes, count);
    const cat = CAT[p.category_id];
    const tally = (key) => recs.filter(r => r[key]).length;
    const tags = [["reliable","Reliable"],["punctual","Punctual"],["communication","Good communication"],["fair_price","Fair price"]]
      .map(([k,label]) => { const n = tally(k); return n ? `<span class="text-[12px] bg-teal/10 text-teal px-2.5 py-1 rounded-full">${label} · ${n}</span>` : ""; }).filter(Boolean).join("");
    const wa = waLink(p.contact);
    el.innerHTML = `
      <a href="#/directory" class="inline-flex items-center gap-1 text-[13px] text-ink/60 mb-3">‹ Back</a>
      <div class="bg-white rounded-2xl p-4 card-shadow">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h1 class="text-xl font-extrabold text-navy leading-tight">${esc(p.alias || p.name)}</h1>
            ${p.alias ? `<div class="text-[13px] text-ink/50">${esc(p.name)}</div>` : ""}
            <div class="mt-1 text-[14px] text-ink/70">${cat?cat.emoji+" "+esc(cat.name):""}${p.area?` · ${esc(p.area)}`:""}</div>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div class="bg-sand rounded-xl p-3 text-center"><div class="text-lg font-bold text-teal">${count}</div><div class="text-[10px] uppercase tracking-wide text-ink/50">recommendation${count===1?"":"s"}</div></div>
          <div class="bg-sand rounded-xl p-3 text-center"><div class="text-lg font-bold text-green-700">${count?wha+"%":"—"}</div><div class="text-[10px] uppercase tracking-wide text-ink/50">would hire again</div></div>
        </div>
        ${tags?`<div class="mt-3 flex flex-wrap gap-1.5">${tags}</div>`:""}
        <div class="mt-4 flex gap-2">
          ${wa?`<a href="${wa}" target="_blank" rel="noopener" class="flex-1 text-center bg-[#25D366] text-white font-semibold text-sm py-2.5 rounded-full">WhatsApp</a>`:""}
          ${p.contact?`<a href="tel:${esc(p.contact)}" class="flex-1 text-center bg-navy text-white font-semibold text-sm py-2.5 rounded-full">Call</a>`:`<span class="flex-1 text-center text-[13px] text-ink/40 py-2.5">No contact on file</span>`}
        </div>
        <a href="#/recommend?pid=${encodeURIComponent(p.id)}&pname=${encodeURIComponent(p.name)}&cat=${p.category_id}" class="block text-center mt-2 text-[13px] text-teal font-semibold">+ Add your recommendation</a>
      </div>
      <h2 class="font-bold text-navy mt-5 mb-2">Recommendations</h2>
      <div class="space-y-2.5">${count ? recs.map(recCard).join("") : `<div class="bg-white rounded-2xl p-5 text-center text-[13px] text-ink/60 card-shadow">No recommendations yet. If you've hired them, be the first to vouch.</div>`}</div>
      <button id="reportBtn" class="w-full mt-4 text-[12px] text-ink/45 py-2">Something wrong? Share a private concern ›</button>
      <div class="h-4"></div>`;
    document.getElementById("reportBtn").addEventListener("click", () => openWarning(p));
  }

  function recCard(r) {
    const tags = [["reliable","Reliable"],["punctual","Punctual"],["communication","Communication"],["fair_price","Fair price"]]
      .filter(([k]) => r[k]).map(([,l]) => `<span class="text-[11px] bg-teal/10 text-teal px-2 py-0.5 rounded-full">${l}</span>`).join("");
    return `<div class="bg-white rounded-2xl p-4 card-shadow">
      <div class="flex items-center justify-between">
        <div class="text-[13px] font-semibold text-navy">${esc(r.recommender_display || "A resident")}</div>
        ${r.would_hire_again ? `<span class="text-[11px] text-green-700 font-semibold">👍 Would hire again</span>` : ""}
      </div>
      ${r.reason ? `<p class="text-[14px] text-ink/80 mt-1">${esc(r.reason)}</p>` : ""}
      ${r.job_type ? `<div class="text-[12px] text-ink/50 mt-1">Job: ${esc(r.job_type)}</div>` : ""}
      ${tags ? `<div class="mt-2 flex flex-wrap gap-1.5">${tags}</div>` : ""}
    </div>`;
  }

  // ---------- Recommend flow ----------
  async function recommend(params) {
    setTab("recommend");
    const presetName = params.get("pname") || "";
    const presetCat = params.get("cat") || "";
    const presetPid = params.get("pid") || "";
    const catOptions = CATEGORIES.map(c => `<option value="${c.id}" ${presetCat===c.id?"selected":""}>${c.emoji} ${c.name}</option>`).join("");
    el.innerHTML = `
      <h1 class="text-xl font-extrabold text-navy mt-1">Recommend someone</h1>
      <p class="text-[13px] text-ink/60 mt-1 mb-4">Takes about 20 seconds. Only the first three are required.</p>
      <form id="recForm" class="space-y-4">
        <div>
          <label class="block text-[13px] font-semibold text-navy mb-1">What do they do? <span class="text-red-500">*</span></label>
          <select name="category_id" required class="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[15px]">
            <option value="">Choose a trade…</option>${catOptions}
          </select>
        </div>
        <div>
          <label class="block text-[13px] font-semibold text-navy mb-1">Their name or nickname <span class="text-red-500">*</span></label>
          <input name="name" required value="${esc(presetName)}" placeholder="e.g. Ricky the AC Man" class="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[15px]">
        </div>
        <div>
          <label class="block text-[13px] font-semibold text-navy mb-1">Would you recommend them? <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-2 gap-2" id="whaGroup">
            <label class="cursor-pointer"><input type="radio" name="would_hire_again" value="yes" class="peer sr-only" required><span class="block text-center py-2.5 rounded-xl border border-black/10 bg-white peer-checked:bg-teal peer-checked:text-white peer-checked:border-teal text-[14px] font-semibold">👍 Yes</span></label>
            <label class="cursor-pointer"><input type="radio" name="would_hire_again" value="no" class="peer sr-only"><span class="block text-center py-2.5 rounded-xl border border-black/10 bg-white peer-checked:bg-navy peer-checked:text-white peer-checked:border-navy text-[14px] font-semibold">Not sure</span></label>
          </div>
        </div>

        <details class="bg-white rounded-xl border border-black/10 p-3">
          <summary class="text-[13px] font-semibold text-teal cursor-pointer">Add more (optional)</summary>
          <div class="space-y-3 mt-3">
            <div><label class="block text-[13px] text-navy mb-1">Phone / WhatsApp</label><input name="contact" inputmode="tel" placeholder="+1 268 …" class="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]"></div>
            <div><label class="block text-[13px] text-navy mb-1">Area they serve</label><input name="area" placeholder="e.g. Jolly Harbour" class="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]"></div>
            <div><label class="block text-[13px] text-navy mb-1">Why do you recommend them?</label><textarea name="reason" rows="2" placeholder="e.g. Built my wall neatly, fair price" class="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]"></textarea></div>
            <div><label class="block text-[13px] text-navy mb-1">What job did they do?</label><input name="job_type" placeholder="e.g. AC repair" class="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]"></div>
            <div>
              <label class="block text-[13px] text-navy mb-1">What was good?</label>
              <div class="flex flex-wrap gap-2">
                ${[["reliable","Reliable"],["punctual","Punctual"],["communication","Good communication"],["fair_price","Fair price"]].map(([k,l])=>`<label class="cursor-pointer"><input type="checkbox" name="${k}" class="peer sr-only"><span class="block text-[13px] px-3 py-1.5 rounded-full border border-black/10 bg-white peer-checked:bg-teal/10 peer-checked:text-teal peer-checked:border-teal/40">${l}</span></label>`).join("")}
              </div>
            </div>
            <div class="border-t border-black/5 pt-3">
              <label class="block text-[13px] text-navy mb-1">Private note or warning</label>
              <p class="text-[11px] text-ink/50 mb-1">Only our team sees this. It is never shown publicly.</p>
              <textarea name="private_note" rows="2" placeholder="Anything we should quietly know?" class="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px] bg-sand"></textarea>
            </div>
          </div>
        </details>

        <button type="submit" class="w-full bg-gold text-white font-bold py-3 rounded-full text-[15px]">Add recommendation</button>
        <p id="recMsg" class="text-center text-[13px]"></p>
      </form>
      <div class="h-4"></div>`;

    document.getElementById("recForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target; const fd = new FormData(f);
      const msg = document.getElementById("recMsg");
      const btn = f.querySelector("button[type=submit]");
      const name = (fd.get("name")||"").trim();
      const category_id = fd.get("category_id");
      if (!name || !category_id || !fd.get("would_hire_again")) { msg.textContent = "Please fill in the three required fields."; msg.className="text-center text-[13px] text-red-600"; return; }
      btn.disabled = true; btn.textContent = "Saving…";
      try {
        if (!LIVE) {
          msg.innerHTML = "✅ Thanks! In preview mode this isn't saved yet — it will be once the database is connected.";
          msg.className = "text-center text-[13px] text-green-700"; btn.disabled=false; btn.textContent="Add recommendation"; f.reset(); return;
        }
        let providerId = presetPid;
        if (!providerId) {
          const prov = await api.findOrCreateProvider({ name, category_id, area: fd.get("area"), contact: fd.get("contact") });
          providerId = prov.id;
        }
        await api.addRecommendation({
          provider_id: providerId,
          recommender_display: null,
          reason: (fd.get("reason")||"").trim() || null,
          job_type: (fd.get("job_type")||"").trim() || null,
          would_hire_again: fd.get("would_hire_again") === "yes",
          reliable: !!fd.get("reliable"), punctual: !!fd.get("punctual"),
          communication: !!fd.get("communication"), fair_price: !!fd.get("fair_price"),
        });
        const priv = (fd.get("private_note")||"").trim();
        if (priv) { await api.addWarning({ provider_id: providerId, provider_name: name, warning: priv }); }
        msg.innerHTML = `✅ Thank you! Your recommendation has been added. <a class="text-teal underline" href="#/provider/${encodeURIComponent(providerId)}">View profile</a>`;
        msg.className = "text-center text-[13px] text-green-700";
        f.reset();
      } catch (err) {
        console.error(err); msg.textContent = "Sorry, something went wrong saving that. Please try again."; msg.className="text-center text-[13px] text-red-600";
      } finally { btn.disabled = false; btn.textContent = "Add recommendation"; }
    });
  }

  // Private-warning modal on a profile
  function openWarning(p) {
    const wrap = document.createElement("div");
    wrap.className = "fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center";
    wrap.innerHTML = `<div class="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-4">
      <h3 class="font-bold text-navy">Share a private concern</h3>
      <p class="text-[12px] text-ink/60 mt-1">This goes only to our team for review. We never post public complaints about anyone. It helps us keep the list honest.</p>
      <textarea id="wText" rows="3" class="w-full mt-3 rounded-xl border border-black/10 px-3 py-2.5 text-[15px] bg-sand" placeholder="What happened?"></textarea>
      <div class="flex gap-2 mt-3">
        <button id="wCancel" class="flex-1 py-2.5 rounded-full border border-black/10 text-[14px]">Cancel</button>
        <button id="wSend" class="flex-1 py-2.5 rounded-full bg-navy text-white font-semibold text-[14px]">Send privately</button>
      </div>
      <p id="wMsg" class="text-center text-[13px] mt-2"></p>
    </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector("#wCancel").onclick = () => wrap.remove();
    wrap.addEventListener("click", e => { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector("#wSend").onclick = async () => {
      const t = wrap.querySelector("#wText").value.trim(); const m = wrap.querySelector("#wMsg");
      if (!t) { m.textContent = "Please write a short note."; m.className="text-center text-[13px] text-red-600"; return; }
      try {
        if (!LIVE) { m.textContent = "✅ Noted (preview mode — not saved yet)."; }
        else { await api.addWarning({ provider_id: p.id, provider_name: p.name, warning: t }); m.textContent = "✅ Thank you — sent privately to our team."; }
        m.className = "text-center text-[13px] text-green-700";
        setTimeout(() => wrap.remove(), 1400);
      } catch (e) { m.textContent = "Could not send. Please try again."; m.className="text-center text-[13px] text-red-600"; }
    };
  }

  // ---------- Router ----------
  function parseHash() {
    const raw = (location.hash || "#/").slice(1); // e.g. /directory?cat=ac
    const [path, query] = raw.split("?");
    return { path: path || "/", params: new URLSearchParams(query || "") };
  }
  async function route() {
    const { path, params } = parseHash();
    window.scrollTo(0, 0);
    if (path === "/" || path === "") return home();
    if (path === "/directory") return directory(params);
    if (path.startsWith("/provider/")) return providerView(decodeURIComponent(path.split("/provider/")[1]));
    if (path === "/recommend") return recommend(params);
    return home();
  }
  window.addEventListener("hashchange", route);
  route();
})();
