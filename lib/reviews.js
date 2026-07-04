// Feature 5A — structured review vocabulary (no scoring engine yet).

// Six core scored dimensions (0–10). Order = display order.
export const CORE_DIMENSIONS = [
  { key: "finished", label: "Finished work" },
  { key: "reliability", label: "Reliability" },
  { key: "punctuality", label: "Punctuality" },
  { key: "communication", label: "Communication" },
  { key: "value", label: "Value for money" },
  { key: "professionalism", label: "Professionalism" },
];

// Optional supporting signals (0–10) — do not feed any headline number in 5A.
export const OPTIONAL_DIMENSIONS = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "problem_solving", label: "Problem solving" },
  { key: "speed", label: "Speed of completion" },
];

export const ALL_DIMENSIONS = [...CORE_DIMENSIONS, ...OPTIONAL_DIMENSIONS];

// Column name in `recommendations` for a dimension key.
export const dimCol = (key) => `score_${key}`;
export const dimAvgCol = (key) => `avg_${key}`;

// Approximate timeframe buckets (value stored; label shown).
export const TIMEFRAMES = [
  { value: "this_week", label: "This week" },
  { value: "last_month", label: "Within the last month" },
  { value: "1_3_months", label: "1–3 months ago" },
  { value: "3_6_months", label: "3–6 months ago" },
  { value: "6_12_months", label: "6–12 months ago" },
  { value: "over_year", label: "More than a year ago" },
];
export const timeframeLabel = (v) => TIMEFRAMES.find((t) => t.value === v)?.label || "";

// Per-trade work-type tags. "Other" always available.
export const WORK_TYPES = {
  electrical: ["Fault finding", "Rewiring", "Ceiling fan install", "Generator install", "Solar install", "Panel upgrade", "Lighting", "Sockets / outlets", "Inspection"],
  plumbing: ["Leak repair", "Bathroom install", "Water tank", "Pump replacement", "Drainage", "Water heater", "Toilet / fixtures"],
  ac: ["AC install", "AC servicing", "AC repair", "Refrigeration", "Cold room"],
  masonry: ["Blockwork", "Concrete / foundation", "Plastering", "Tiling", "Wall / boundary", "General construction", "Repairs"],
  gardening: ["Lawn care", "Landscaping", "Tree / hedge work", "Planting", "Yard clearing", "Maintenance"],
  cleaning: ["Home cleaning", "Deep clean", "Post-construction", "Move in / out", "Regular service"],
};
export const workTypesFor = (categoryId) => [...(WORK_TYPES[categoryId] || []), "Other"];

// Minimum full (scored) reviews before per-dimension averages are shown.
// Below this the profile shows "Building reputation".
export const DIMENSION_THRESHOLD = 3;
