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
