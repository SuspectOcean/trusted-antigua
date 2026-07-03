// Migration = the six categories currently live. (Expansion to 10 + "Other" is a later feature.)
export const CATEGORIES = [
  { id: "electrical", name: "Electrical", emoji: "⚡", blurb: "Wiring, faults, fittings, panels" },
  { id: "plumbing", name: "Plumbing", emoji: "🚿", blurb: "Leaks, pipes, tanks, fixtures" },
  { id: "ac", name: "AC / Refrigeration", emoji: "❄️", blurb: "Air-con, fridges, cold rooms" },
  { id: "masonry", name: "Masonry / Building", emoji: "🧱", blurb: "Block, concrete, construction" },
  { id: "gardening", name: "Gardening / Landscaping", emoji: "🌿", blurb: "Yards, lawns, planting" },
  { id: "cleaning", name: "Cleaning", emoji: "🧽", blurb: "Homes, deep cleans, turnovers" },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const catName = (id) => CAT[id]?.name || id || "";

// Everyday words + Antiguan slang mapped to a trade, so people can search how they speak.
// Multi-word entries (e.g. "current man") match anywhere in the query; single words match whole words.
export const CATEGORY_SYNONYMS = {
  electrical: ["electric", "electrical", "electrician", "current man", "current", "wiring", "wire", "socket", "outlet", "breaker", "panel", "light", "lighting", "power", "fuse", "generator", "inverter", "solar"],
  plumbing: ["plumber", "plumbing", "leak", "leaking", "fix a leak", "pipe", "pipes", "water", "tank", "cistern", "toilet", "tap", "faucet", "drain", "sink", "shower", "blockage", "burst"],
  ac: ["ac", "a/c", "aircon", "air con", "air-con", "air conditioning", "air conditioner", "ac man", "acman", "refrigeration", "fridge", "freezer", "cooling", "cold room", "split unit"],
  masonry: ["mason", "masonry", "builder", "building", "concrete", "cement", "block", "blocks", "blockwork", "wall", "construction", "plaster", "plastering", "render", "rendering", "foundation", "tile", "tiles", "tiling"],
  gardening: ["garden", "gardener", "gardening", "landscaping", "landscaper", "landscape", "lawn", "yard", "grass", "bush", "tree", "trees", "planting", "hedge", "trimming"],
  cleaning: ["clean", "cleaner", "cleaning", "housekeeping", "maid", "deep clean", "turnover", "laundry", "domestic"],
};

// Return the category ids a free-text query implies (via synonyms/slang).
export function categoriesForQuery(query) {
  const t = (query || "").toLowerCase().trim();
  if (!t) return [];
  const words = new Set(t.split(/\s+/));
  const hits = new Set();
  for (const [cat, syns] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const s of syns) {
      const matched = s.includes(" ") ? t.includes(s) : words.has(s);
      if (matched) { hits.add(cat); break; }
    }
    // Also match the category's own display name.
    if ((CAT[cat]?.name || "").toLowerCase().includes(t)) hits.add(cat);
  }
  return [...hits];
}

// Words too generic to be useful as search tokens.
export const SEARCH_STOPWORDS = new Set([
  "the", "and", "for", "need", "want", "some", "someone", "somebody", "good", "best", "near",
  "who", "can", "you", "find", "looking", "recommend", "a", "an", "to", "in", "of", "my", "me",
  "is", "there", "any", "get", "work", "job", "man", "guy", "lady", "please", "help",
]);

export const AREAS = [
  "St John's",
  "All Saints",
  "Jolly Harbour",
  "English Harbour",
  "Falmouth",
  "Liberta",
  "Bolans",
  "Old Road",
  "Willikies",
  "Parham",
  "Piggotts",
  "Cedar Grove",
  "Five Islands",
  "Swetes",
  "Freetown / Seatons",
  "Island-wide",
  "Other",
];

// Specific areas a provider can pick when they don't serve the whole island.
export const SELECTABLE_AREAS = AREAS.filter((a) => a !== "Island-wide" && a !== "Other");
