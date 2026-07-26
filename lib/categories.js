// Trusted Antigua taxonomy — two levels: GROUP -> CATEGORY.
// Scope: INDIVIDUALS you hire and need to trust — tradespeople, skilled workers,
// freelancers and sole traders (gardeners, electricians, handymen, mechanics,
// tutors, hairdressers…). NOT premises-based businesses (restaurants, cafés,
// shops, hotels, banks, clinics) — this is not a business/restaurant directory.
//
// A provider stores one primary `category_id` (a slug below) plus optional
// `secondary_categories` (array of slugs). A category's group is derived here in
// code, so there is no group column in the database. Existing live slugs
// (electrical, plumbing, ac, masonry, gardening, cleaning) are preserved.

export const GROUPS = [
  { id: "building", name: "Building & Construction", emoji: "🏗️", blurb: "Trades that build, fix and finish" },
  { id: "home", name: "Home Services", emoji: "🏠", blurb: "Keeping homes running and cared for" },
  { id: "marine", name: "Marine", emoji: "⚓", blurb: "Boat and yacht trades" },
  { id: "automotive", name: "Automotive & Transport", emoji: "🚗", blurb: "Vehicle care and getting around" },
  { id: "professional", name: "Professional Services", emoji: "💼", blurb: "Legal, financial and business help" },
  { id: "technology", name: "Technology", emoji: "💻", blurb: "IT, web and device support" },
  { id: "creative", name: "Creative & Events", emoji: "🎨", blurb: "Photo, video, music and planning" },
  { id: "health", name: "Health & Personal Care", emoji: "🩺", blurb: "Wellbeing, fitness and grooming" },
  { id: "property", name: "Property Services", emoji: "🔑", blurb: "Agents, managers and valuers" },
  { id: "education", name: "Education & Lessons", emoji: "📚", blurb: "Tutoring, lessons and training" },
  { id: "pets", name: "Pets", emoji: "🐾", blurb: "Grooming, sitting and walking" },
  { id: "other", name: "Other Services", emoji: "✨", blurb: "Other individual services" },
];
export const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

// Categories. `group` links each to a GROUP above. Emoji used in select pickers.
export const CATEGORIES = [
  // Building & Construction
  { id: "masonry", group: "building", name: "Masonry / Building", emoji: "🧱", blurb: "Block, concrete, construction" },
  { id: "electrical", group: "building", name: "Electrical", emoji: "⚡", blurb: "Wiring, faults, fittings, panels" },
  { id: "plumbing", group: "building", name: "Plumbing", emoji: "🚿", blurb: "Leaks, pipes, tanks, fixtures" },
  { id: "carpentry", group: "building", name: "Carpentry & Joinery", emoji: "🪚", blurb: "Wood, doors, cabinets, decks, furniture" },
  { id: "roofing", group: "building", name: "Roofing", emoji: "🏠", blurb: "Roofs, sheeting, leaks" },
  { id: "painting", group: "building", name: "Painting & Decorating", emoji: "🎨", blurb: "Interior and exterior" },
  { id: "tiling", group: "building", name: "Tiling & Flooring", emoji: "◻️", blurb: "Tiles, floors, finishes" },
  { id: "welding", group: "building", name: "Welding & Metalwork", emoji: "🔩", blurb: "Gates, rails, fabrication" },
  { id: "contractor", group: "building", name: "General Contractor", emoji: "👷", blurb: "Full builds and renovations" },
  { id: "architecture", group: "building", name: "Architects & Surveyors", emoji: "📐", blurb: "Plans, drawings and surveys" },
  { id: "excavation", group: "building", name: "Excavation & Groundwork", emoji: "🚜", blurb: "Digging, clearing, foundations" },

  // Home Services
  { id: "ac", group: "home", name: "AC / Refrigeration", emoji: "❄️", blurb: "Air-con, fridges, cold rooms" },
  { id: "cleaning", group: "home", name: "Cleaning", emoji: "🧽", blurb: "Homes, deep cleans, turnovers" },
  { id: "gardening", group: "home", name: "Gardening / Landscaping", emoji: "🌿", blurb: "Yards, lawns, planting" },
  { id: "pool", group: "home", name: "Pool Maintenance", emoji: "🏊", blurb: "Cleaning, chemicals, repair" },
  { id: "pest", group: "home", name: "Pest Control", emoji: "🐜", blurb: "Ants, termites, rodents" },
  { id: "appliance", group: "home", name: "Appliance Repair", emoji: "🔧", blurb: "Washers, ovens, more" },
  { id: "handyman", group: "home", name: "Handyman", emoji: "🛠️", blurb: "Odd jobs and small fixes" },
  { id: "security", group: "home", name: "Home Security & CCTV", emoji: "🎥", blurb: "Cameras, alarms, access" },
  { id: "solar", group: "home", name: "Solar & Energy", emoji: "☀️", blurb: "Panels, inverters, batteries" },
  { id: "movers", group: "home", name: "Moving & Removals", emoji: "📦", blurb: "House and office moves" },
  { id: "interior", group: "home", name: "Interior Design", emoji: "🛋️", blurb: "Styling and furnishing" },
  { id: "textiles", group: "home", name: "Tailoring & Alterations", emoji: "🧵", blurb: "Sewing, repairs, alterations" },

  // Marine (trades — not charters or shops)
  { id: "boat_repair", group: "marine", name: "Boat Repair & Maintenance", emoji: "🛥️", blurb: "Hull, systems, upkeep" },
  { id: "marine_engine", group: "marine", name: "Marine Engineering", emoji: "⚙️", blurb: "Engines and mechanics" },
  { id: "fiberglass", group: "marine", name: "Fibreglass & Hull", emoji: "🩹", blurb: "Repairs and finishing" },
  { id: "marine_electronics", group: "marine", name: "Marine Electronics", emoji: "📡", blurb: "Nav, radio, wiring" },
  { id: "rigging", group: "marine", name: "Sailmaking & Rigging", emoji: "⛵", blurb: "Sails, ropes, rigging" },
  { id: "captain", group: "marine", name: "Captains & Crew", emoji: "🧭", blurb: "Skippers and hands" },
  { id: "yacht_management", group: "marine", name: "Yacht Management", emoji: "📋", blurb: "Care and provisioning" },

  // Automotive & Transport
  { id: "mechanic", group: "automotive", name: "Auto Mechanic", emoji: "🔧", blurb: "Service and repairs" },
  { id: "bodywork", group: "automotive", name: "Bodywork & Paint", emoji: "🚗", blurb: "Panels, dents, respray" },
  { id: "tyres", group: "automotive", name: "Tyres & Wheels", emoji: "🛞", blurb: "Fit, balance, punctures" },
  { id: "auto_electric", group: "automotive", name: "Auto Electrical & AC", emoji: "🔌", blurb: "Batteries, wiring, vehicle AC" },
  { id: "car_detailing", group: "automotive", name: "Car Wash & Detailing", emoji: "🧼", blurb: "Cleaning and valeting" },
  { id: "towing", group: "automotive", name: "Towing & Recovery", emoji: "🚛", blurb: "Breakdown and recovery" },
  { id: "motorcycle", group: "automotive", name: "Motorcycle & Scooter", emoji: "🏍️", blurb: "Bike service and repair" },
  { id: "taxi", group: "automotive", name: "Taxi & Private Driver", emoji: "🚕", blurb: "Rides around the island" },
  { id: "airport_transfer", group: "automotive", name: "Airport Transfers", emoji: "✈️", blurb: "To and from V.C. Bird" },
  { id: "delivery", group: "automotive", name: "Delivery & Courier", emoji: "📮", blurb: "Local drop-offs" },

  // Professional Services (individual professionals & freelancers)
  { id: "legal", group: "professional", name: "Legal & Attorneys", emoji: "⚖️", blurb: "Law and advice" },
  { id: "accounting", group: "professional", name: "Accounting & Bookkeeping", emoji: "📊", blurb: "Books and returns" },
  { id: "tax_services", group: "professional", name: "Tax Services", emoji: "🧾", blurb: "Filing and advice" },
  { id: "financial_advice", group: "professional", name: "Financial Advisers", emoji: "📈", blurb: "Planning and investing" },
  { id: "consulting", group: "professional", name: "Business Consulting", emoji: "💼", blurb: "Strategy and ops" },
  { id: "marketing", group: "professional", name: "Marketing & PR", emoji: "📣", blurb: "Promotion and brand" },
  { id: "hr", group: "professional", name: "HR & Recruitment", emoji: "🧑‍💼", blurb: "Hiring and staff" },
  { id: "notary", group: "professional", name: "Notary & Documents", emoji: "📄", blurb: "Certified paperwork" },
  { id: "translation", group: "professional", name: "Translation", emoji: "🗣️", blurb: "Languages and docs" },
  { id: "admin_services", group: "professional", name: "Admin & Secretarial", emoji: "🗂️", blurb: "Office support" },

  // Technology
  { id: "it_support", group: "technology", name: "IT Support", emoji: "💻", blurb: "Setup and helpdesk" },
  { id: "web_dev", group: "technology", name: "Web & App Development", emoji: "🌐", blurb: "Sites and apps" },
  { id: "device_repair", group: "technology", name: "Computer & Phone Repair", emoji: "🔧", blurb: "Fix devices" },
  { id: "networking", group: "technology", name: "Networking & WiFi", emoji: "📶", blurb: "Internet and networks" },
  { id: "av_smart", group: "technology", name: "AV & Smart Home", emoji: "🎛️", blurb: "Audio, TV, automation" },
  { id: "cybersecurity", group: "technology", name: "Cybersecurity", emoji: "🔐", blurb: "Protection and audits" },

  // Creative & Events
  { id: "photography", group: "creative", name: "Photography", emoji: "📷", blurb: "Events and portraits" },
  { id: "videography", group: "creative", name: "Videography & Film", emoji: "🎥", blurb: "Video and drone" },
  { id: "graphic_design", group: "creative", name: "Graphic Design", emoji: "🖌️", blurb: "Logos and artwork" },
  { id: "social_media", group: "creative", name: "Content & Social Media", emoji: "📱", blurb: "Posts and campaigns" },
  { id: "music", group: "creative", name: "Musicians & Bands", emoji: "🎸", blurb: "Live music and acts" },
  { id: "dj", group: "creative", name: "DJs & Entertainment", emoji: "🎧", blurb: "Music and hosts" },
  { id: "event_planning", group: "creative", name: "Event Planning", emoji: "🎉", blurb: "Full event management" },
  { id: "weddings", group: "creative", name: "Weddings", emoji: "💒", blurb: "Ceremony and reception" },
  { id: "sound_staging", group: "creative", name: "Sound & Staging", emoji: "🔊", blurb: "PA, lights, stage" },
  { id: "florist", group: "creative", name: "Florist", emoji: "💐", blurb: "Flowers and bouquets" },

  // Health & Personal Care (individual practitioners — not clinics or pharmacies)
  { id: "physio", group: "health", name: "Physiotherapy", emoji: "🧘", blurb: "Rehab and mobility" },
  { id: "nursing", group: "health", name: "Nursing & Home Care", emoji: "🏥", blurb: "In-home care" },
  { id: "fitness", group: "health", name: "Fitness & Personal Training", emoji: "🏋️", blurb: "Coaches and trainers" },
  { id: "spa", group: "health", name: "Massage & Spa Therapy", emoji: "💆", blurb: "Relax and recover" },
  { id: "beauty", group: "health", name: "Beauty & Hair", emoji: "💇", blurb: "Stylists, barbers, nails, makeup" },
  { id: "counselling", group: "health", name: "Counselling & Therapy", emoji: "🧠", blurb: "Mental wellbeing" },
  { id: "nutrition", group: "health", name: "Nutrition & Wellness", emoji: "🥗", blurb: "Diet and lifestyle" },

  // Property Services (the people — not rental listings)
  { id: "realtor", group: "property", name: "Real Estate Agents", emoji: "🏡", blurb: "Buy and sell" },
  { id: "property_mgmt", group: "property", name: "Property Management", emoji: "🔑", blurb: "Care for properties" },
  { id: "valuation", group: "property", name: "Valuation & Appraisal", emoji: "📊", blurb: "Property valuations" },

  // Education & Lessons
  { id: "tutoring", group: "education", name: "Tutoring", emoji: "📚", blurb: "School subjects" },
  { id: "music_lessons", group: "education", name: "Music Lessons", emoji: "🎵", blurb: "Instruments and voice" },
  { id: "driving_school", group: "education", name: "Driving Instructors", emoji: "🚗", blurb: "Learn to drive" },
  { id: "languages", group: "education", name: "Language Classes", emoji: "🗣️", blurb: "Learn a language" },
  { id: "childcare", group: "education", name: "Childcare & Nannies", emoji: "🧸", blurb: "Early years care" },
  { id: "vocational", group: "education", name: "Vocational Training", emoji: "🎓", blurb: "Skills and trades" },

  // Pets (individual services — not vet clinics or shops)
  { id: "pet_grooming", group: "pets", name: "Pet Grooming", emoji: "✂️", blurb: "Wash and trim" },
  { id: "pet_sitting", group: "pets", name: "Pet Sitting & Walking", emoji: "🦮", blurb: "Care while away" },

  // Other individual services
  { id: "private_chef", group: "other", name: "Private Chef & Catering", emoji: "👨‍🍳", blurb: "In-villa dining and events" },
  { id: "other", group: "other", name: "Other Service", emoji: "✨", blurb: "Something else" },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const catName = (id) => CAT[id]?.name || id || "";
export const groupName = (id) => GROUP[id]?.name || id || "";
// The group id a category belongs to (or null).
export const groupOf = (catId) => CAT[catId]?.group || null;
// All categories within a group.
export const categoriesInGroup = (groupId) => CATEGORIES.filter((c) => c.group === groupId);
// Groups paired with their categories, for grouped pickers and browse pages.
export const GROUPED = GROUPS.map((g) => ({ ...g, categories: categoriesInGroup(g.id) }));

// Everyday words + Antiguan slang mapped to a category, so people can search how they speak.
// Multi-word entries (e.g. "current man") match anywhere in the query; single words match whole words.
export const CATEGORY_SYNONYMS = {
  electrical: ["electric", "electrical", "electrician", "current man", "current", "wiring", "wire", "socket", "outlet", "breaker", "panel", "light", "lighting", "power", "fuse", "generator", "inverter"],
  plumbing: ["plumber", "plumbing", "leak", "leaking", "fix a leak", "pipe", "pipes", "water", "tank", "cistern", "toilet", "tap", "faucet", "drain", "sink", "shower", "blockage", "burst"],
  ac: ["ac", "a/c", "aircon", "air con", "air-con", "air conditioning", "air conditioner", "ac man", "acman", "refrigeration", "fridge", "freezer", "cooling", "cold room", "split unit"],
  masonry: ["mason", "masonry", "builder", "building", "concrete", "cement", "block", "blocks", "blockwork", "wall", "construction", "plaster", "plastering", "render", "foundation"],
  gardening: ["garden", "gardener", "gardening", "landscaping", "landscaper", "landscape", "lawn", "yard", "grass", "bush", "tree", "trees", "planting", "hedge", "trimming"],
  cleaning: ["clean", "cleaner", "cleaning", "housekeeping", "maid", "deep clean", "turnover", "laundry", "domestic"],
  carpentry: ["carpenter", "carpentry", "joinery", "joiner", "wood", "cabinet", "cabinets", "deck", "door", "doors", "furniture"],
  roofing: ["roof", "roofer", "roofing", "sheeting", "galvanize", "gutter"],
  painting: ["paint", "painter", "painting", "decorator", "spray"],
  tiling: ["tile", "tiler", "tiling", "flooring", "floor", "grout"],
  welding: ["weld", "welder", "welding", "metalwork", "gate", "rail", "railing", "fabrication"],
  pool: ["pool", "swimming pool", "pool guy", "pool cleaning"],
  pest: ["pest", "pest control", "termite", "termites", "roach", "roaches", "ants", "rodent", "exterminator", "fumigation"],
  appliance: ["appliance", "washer", "washing machine", "dryer", "oven", "stove", "microwave", "dishwasher"],
  handyman: ["handyman", "odd jobs", "small repairs", "general repairs"],
  solar: ["solar", "solar panel", "pv", "inverter", "battery", "off grid", "renewable"],
  security: ["cctv", "camera", "cameras", "alarm", "security", "surveillance"],
  movers: ["mover", "movers", "moving", "removal", "removals", "relocation", "haul"],
  textiles: ["tailor", "seamstress", "sewing", "alterations", "hemming", "dressmaker", "clothing repair"],
  mechanic: ["mechanic", "car repair", "auto repair", "garage", "engine", "service car", "car service"],
  bodywork: ["bodywork", "body shop", "dent", "dents", "respray", "paint car", "panel beating"],
  tyres: ["tyre", "tyres", "tire", "tires", "puncture", "wheel", "wheels", "balance", "alignment"],
  auto_electric: ["auto electric", "auto electrical", "car battery", "car ac", "car air con", "car wiring"],
  car_detailing: ["car wash", "detailing", "valet", "wash car"],
  towing: ["tow", "towing", "recovery", "breakdown", "wrecker"],
  motorcycle: ["motorcycle", "bike", "scooter", "moped"],
  taxi: ["taxi", "cab", "driver", "private driver", "ride"],
  airport_transfer: ["airport", "transfer", "airport transfer", "pickup", "drop off"],
  delivery: ["delivery", "courier", "drop off", "dispatch"],
  boat_repair: ["boat repair", "boat", "marine", "hull", "yacht repair", "bottom job", "antifoul"],
  marine_engine: ["outboard", "marine engine", "inboard", "boat engine"],
  captain: ["captain", "skipper", "crew", "delivery skipper"],
  private_chef: ["private chef", "chef", "personal chef", "catering", "caterer", "cater"],
  photography: ["photographer", "photography", "photos", "photo", "headshots", "wedding photographer"],
  videography: ["videographer", "video", "film", "drone", "videography"],
  it_support: ["it", "it support", "computer help", "tech support", "helpdesk"],
  web_dev: ["website", "web design", "web developer", "app", "developer"],
  device_repair: ["phone repair", "computer repair", "laptop repair", "screen repair", "device repair"],
  networking: ["wifi", "wi-fi", "network", "internet", "router"],
  legal: ["lawyer", "attorney", "legal", "solicitor", "notary"],
  accounting: ["accountant", "accounting", "bookkeeping", "bookkeeper", "tax return"],
  realtor: ["real estate", "realtor", "estate agent", "property for sale", "buy house"],
  pet_grooming: ["dog grooming", "pet grooming", "groomer"],
  pet_sitting: ["pet sitting", "dog walking", "dog walker", "pet sitter"],
  tutoring: ["tutor", "tutoring", "lessons", "teacher", "maths", "extra lessons"],
  event_planning: ["event", "event planner", "party planner", "planner"],
  weddings: ["wedding", "wedding planner", "bride"],
  dj: ["dj", "disc jockey", "entertainment"],
  beauty: ["hair", "hairdresser", "barber", "salon", "nails", "makeup", "beauty"],
  spa: ["spa", "massage", "masseuse", "therapist"],
  fitness: ["gym", "personal trainer", "fitness", "workout", "trainer"],
};

// Return the category ids a free-text query implies (via synonyms/slang + category names).
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
  }
  // Also match any category's display name directly.
  for (const c of CATEGORIES) {
    if (c.name.toLowerCase().includes(t)) hits.add(c.id);
  }
  return [...hits];
}

// Words too generic to be useful as search tokens.
export const SEARCH_STOPWORDS = new Set([
  "the", "and", "for", "need", "want", "some", "someone", "somebody", "good", "best", "near",
  "who", "can", "you", "find", "looking", "recommend", "a", "an", "to", "in", "of", "my", "me",
  "is", "there", "any", "get", "work", "job", "man", "guy", "lady", "please", "help", "service", "services",
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
