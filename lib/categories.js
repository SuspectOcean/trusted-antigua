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
