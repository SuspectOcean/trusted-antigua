// Trusted Antigua taxonomy — two levels: GROUP -> CATEGORY.
// A provider stores one primary `category_id` (a slug below) plus optional
// `secondary_categories` (array of slugs). A category's group is derived here in
// code, so there is no group column in the database. Existing live slugs
// (electrical, plumbing, ac, masonry, gardening, cleaning) are preserved.
//
// Design rule: never assume a flat single-category model. Search, filters,
// advertising targeting and analytics all read groups/categories from here.

export const GROUPS = [
  { id: "building", name: "Building & Construction", emoji: "🏗️", blurb: "Trades that build and fix structures" },
  { id: "home", name: "Home Services", emoji: "🏠", blurb: "Keeping homes running and cared for" },
  { id: "marine", name: "Marine", emoji: "⚓", blurb: "Boats, yachts and everything on the water" },
  { id: "automotive", name: "Automotive", emoji: "🚗", blurb: "Vehicle repair, care and parts" },
  { id: "transport", name: "Transport", emoji: "🚕", blurb: "Getting people and goods around" },
  { id: "tourism", name: "Tourism & Activities", emoji: "🏝️", blurb: "Tours, excursions and island experiences" },
  { id: "hospitality", name: "Hospitality", emoji: "🍽️", blurb: "Food, drink and places to stay" },
  { id: "health", name: "Health & Wellness", emoji: "🩺", blurb: "Medical, wellbeing and personal care" },
  { id: "professional", name: "Professional Services", emoji: "💼", blurb: "Legal, financial and business support" },
  { id: "financial", name: "Financial Services", emoji: "🏦", blurb: "Banking, insurance and money" },
  { id: "technology", name: "Technology", emoji: "💻", blurb: "IT, web and device support" },
  { id: "creative", name: "Creative & Media", emoji: "🎨", blurb: "Photo, video, design and print" },
  { id: "events", name: "Events", emoji: "🎉", blurb: "Planning, entertainment and hire" },
  { id: "property", name: "Property & Real Estate", emoji: "🔑", blurb: "Buying, renting and managing property" },
  { id: "retail", name: "Retail", emoji: "🛍️", blurb: "Shops and local goods" },
  { id: "education", name: "Education", emoji: "📚", blurb: "Tutoring, lessons and training" },
  { id: "pets", name: "Pets", emoji: "🐾", blurb: "Care for animals" },
  { id: "agriculture", name: "Agriculture", emoji: "🌾", blurb: "Farming, livestock and produce" },
  { id: "manufacturing", name: "Manufacturing", emoji: "🏭", blurb: "Making and producing goods" },
  { id: "government", name: "Government & Public Services", emoji: "🏛️", blurb: "Utilities and public administration" },
  { id: "other", name: "Other Services", emoji: "✨", blurb: "Anything else the island needs" },
];
export const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

// Categories. `group` links each to a GROUP above. Emoji used in select pickers.
export const CATEGORIES = [
  // Building & Construction
  { id: "masonry", group: "building", name: "Masonry / Building", emoji: "🧱", blurb: "Block, concrete, construction" },
  { id: "electrical", group: "building", name: "Electrical", emoji: "⚡", blurb: "Wiring, faults, fittings, panels" },
  { id: "plumbing", group: "building", name: "Plumbing", emoji: "🚿", blurb: "Leaks, pipes, tanks, fixtures" },
  { id: "carpentry", group: "building", name: "Carpentry & Joinery", emoji: "🪚", blurb: "Wood, doors, cabinets, decks" },
  { id: "roofing", group: "building", name: "Roofing", emoji: "🏠", blurb: "Roofs, sheeting, leaks" },
  { id: "painting", group: "building", name: "Painting & Decorating", emoji: "🎨", blurb: "Interior and exterior" },
  { id: "tiling", group: "building", name: "Tiling & Flooring", emoji: "◻️", blurb: "Tiles, floors, finishes" },
  { id: "welding", group: "building", name: "Welding & Metalwork", emoji: "🔩", blurb: "Gates, rails, fabrication" },
  { id: "contractor", group: "building", name: "General Contractor", emoji: "👷", blurb: "Full builds and renovations" },
  { id: "architecture", group: "building", name: "Architecture & Drafting", emoji: "📐", blurb: "Plans and drawings" },
  { id: "surveying", group: "building", name: "Surveying & Inspection", emoji: "📏", blurb: "Land and building surveys" },
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

  // Marine
  { id: "boat_repair", group: "marine", name: "Boat Repair & Maintenance", emoji: "🛥️", blurb: "Hull, systems, upkeep" },
  { id: "marine_engine", group: "marine", name: "Marine Engineering", emoji: "⚙️", blurb: "Engines and mechanics" },
  { id: "fiberglass", group: "marine", name: "Fibreglass & Hull", emoji: "🩹", blurb: "Repairs and finishing" },
  { id: "marine_electronics", group: "marine", name: "Marine Electronics", emoji: "📡", blurb: "Nav, radio, wiring" },
  { id: "rigging", group: "marine", name: "Sailmaking & Rigging", emoji: "⛵", blurb: "Sails, ropes, rigging" },
  { id: "captain", group: "marine", name: "Captains & Crew", emoji: "🧭", blurb: "Skippers and hands" },
  { id: "yacht_management", group: "marine", name: "Yacht Management", emoji: "📋", blurb: "Care and provisioning" },
  { id: "boat_charter", group: "marine", name: "Boat Charters", emoji: "🚤", blurb: "Day and term charters" },
  { id: "diving", group: "marine", name: "Diving & Watersports", emoji: "🤿", blurb: "Dive, snorkel, gear" },
  { id: "chandlery", group: "marine", name: "Chandlery & Supplies", emoji: "🧰", blurb: "Parts and provisions" },

  // Automotive
  { id: "mechanic", group: "automotive", name: "Auto Mechanic", emoji: "🔧", blurb: "Service and repairs" },
  { id: "bodywork", group: "automotive", name: "Bodywork & Paint", emoji: "🚗", blurb: "Panels, dents, respray" },
  { id: "tyres", group: "automotive", name: "Tyres & Wheels", emoji: "🛞", blurb: "Fit, balance, punctures" },
  { id: "auto_electric", group: "automotive", name: "Auto Electrical", emoji: "🔌", blurb: "Batteries and wiring" },
  { id: "auto_ac", group: "automotive", name: "Auto Air Conditioning", emoji: "❄️", blurb: "Vehicle AC repair" },
  { id: "car_detailing", group: "automotive", name: "Car Wash & Detailing", emoji: "🧼", blurb: "Cleaning and valeting" },
  { id: "towing", group: "automotive", name: "Towing & Recovery", emoji: "🚛", blurb: "Breakdown and recovery" },
  { id: "auto_parts", group: "automotive", name: "Auto Parts", emoji: "⚙️", blurb: "Spares and accessories" },
  { id: "motorcycle", group: "automotive", name: "Motorcycle & Scooter", emoji: "🏍️", blurb: "Bike service and repair" },

  // Transport
  { id: "taxi", group: "transport", name: "Taxi & Private Driver", emoji: "🚕", blurb: "Rides around the island" },
  { id: "airport_transfer", group: "transport", name: "Airport Transfers", emoji: "✈️", blurb: "To and from V.C. Bird" },
  { id: "car_rental", group: "transport", name: "Vehicle Rental", emoji: "🚙", blurb: "Cars, vans, scooters" },
  { id: "delivery", group: "transport", name: "Delivery & Courier", emoji: "📮", blurb: "Local drop-offs" },
  { id: "bus", group: "transport", name: "Bus & Group Transport", emoji: "🚌", blurb: "Groups and events" },
  { id: "freight", group: "transport", name: "Freight & Shipping", emoji: "🚢", blurb: "Cargo and logistics" },

  // Tourism & Activities
  { id: "tours", group: "tourism", name: "Tours & Excursions", emoji: "🧭", blurb: "Guided island trips" },
  { id: "watersports", group: "tourism", name: "Watersports & Beach", emoji: "🏄", blurb: "Kayak, jet ski, more" },
  { id: "tour_guide", group: "tourism", name: "Tour Guides", emoji: "🗺️", blurb: "Local expert guides" },
  { id: "adventure", group: "tourism", name: "Adventure & Eco Tours", emoji: "🌋", blurb: "Nature and hikes" },
  { id: "cultural", group: "tourism", name: "Cultural & Heritage", emoji: "🏛️", blurb: "History and heritage" },
  { id: "fishing_charter", group: "tourism", name: "Fishing Charters", emoji: "🎣", blurb: "Sport and deep-sea" },

  // Hospitality
  { id: "restaurant", group: "hospitality", name: "Restaurants", emoji: "🍽️", blurb: "Dine-in and takeaway" },
  { id: "catering", group: "hospitality", name: "Catering", emoji: "🍴", blurb: "Events and functions" },
  { id: "private_chef", group: "hospitality", name: "Private Chefs", emoji: "👨‍🍳", blurb: "In-villa and events" },
  { id: "bar", group: "hospitality", name: "Bars & Nightlife", emoji: "🍹", blurb: "Drinks and venues" },
  { id: "bakery", group: "hospitality", name: "Bakery & Desserts", emoji: "🧁", blurb: "Bread, cakes, sweets" },
  { id: "cafe", group: "hospitality", name: "Cafés & Coffee", emoji: "☕", blurb: "Coffee and light bites" },
  { id: "food_vendor", group: "hospitality", name: "Food Trucks & Street Food", emoji: "🌮", blurb: "Local eats on the go" },
  { id: "hotel", group: "hospitality", name: "Hotels & Guesthouses", emoji: "🏨", blurb: "Places to stay" },

  // Health & Wellness
  { id: "doctor", group: "health", name: "Doctors & Clinics", emoji: "🩺", blurb: "General and specialist" },
  { id: "dental", group: "health", name: "Dental", emoji: "🦷", blurb: "Dentists and hygiene" },
  { id: "pharmacy", group: "health", name: "Pharmacy", emoji: "💊", blurb: "Medicines and advice" },
  { id: "physio", group: "health", name: "Physiotherapy", emoji: "🧘", blurb: "Rehab and mobility" },
  { id: "optical", group: "health", name: "Optical", emoji: "👓", blurb: "Eyes and eyewear" },
  { id: "nursing", group: "health", name: "Nursing & Home Care", emoji: "🏥", blurb: "In-home care" },
  { id: "fitness", group: "health", name: "Fitness & Training", emoji: "🏋️", blurb: "Gyms and coaches" },
  { id: "spa", group: "health", name: "Spa & Massage", emoji: "💆", blurb: "Relax and recover" },
  { id: "beauty", group: "health", name: "Beauty & Hair", emoji: "💇", blurb: "Salons and stylists" },
  { id: "counselling", group: "health", name: "Counselling & Therapy", emoji: "🧠", blurb: "Mental wellbeing" },
  { id: "nutrition", group: "health", name: "Nutrition & Wellness", emoji: "🥗", blurb: "Diet and lifestyle" },

  // Professional Services
  { id: "legal", group: "professional", name: "Legal & Attorneys", emoji: "⚖️", blurb: "Law and advice" },
  { id: "accounting", group: "professional", name: "Accounting & Bookkeeping", emoji: "📊", blurb: "Books and returns" },
  { id: "consulting", group: "professional", name: "Business Consulting", emoji: "💼", blurb: "Strategy and ops" },
  { id: "marketing", group: "professional", name: "Marketing & PR", emoji: "📣", blurb: "Promotion and brand" },
  { id: "hr", group: "professional", name: "HR & Recruitment", emoji: "🧑‍💼", blurb: "Hiring and staff" },
  { id: "notary", group: "professional", name: "Notary & Documents", emoji: "📄", blurb: "Certified paperwork" },
  { id: "translation", group: "professional", name: "Translation", emoji: "🗣️", blurb: "Languages and docs" },
  { id: "admin_services", group: "professional", name: "Admin & Secretarial", emoji: "🗂️", blurb: "Office support" },

  // Financial Services
  { id: "bank", group: "financial", name: "Banking", emoji: "🏦", blurb: "Accounts and branches" },
  { id: "insurance", group: "financial", name: "Insurance", emoji: "🛡️", blurb: "Cover and claims" },
  { id: "financial_advice", group: "financial", name: "Financial Advisers", emoji: "📈", blurb: "Planning and investing" },
  { id: "money_transfer", group: "financial", name: "Money Transfer", emoji: "💸", blurb: "Remittance services" },
  { id: "mortgage", group: "financial", name: "Mortgage & Loans", emoji: "🏦", blurb: "Lending and finance" },
  { id: "tax_services", group: "financial", name: "Tax Services", emoji: "🧾", blurb: "Filing and advice" },

  // Technology
  { id: "it_support", group: "technology", name: "IT Support", emoji: "💻", blurb: "Setup and helpdesk" },
  { id: "web_dev", group: "technology", name: "Web & App Development", emoji: "🌐", blurb: "Sites and apps" },
  { id: "device_repair", group: "technology", name: "Computer & Phone Repair", emoji: "🔧", blurb: "Fix devices" },
  { id: "networking", group: "technology", name: "Networking & WiFi", emoji: "📶", blurb: "Internet and networks" },
  { id: "av_smart", group: "technology", name: "AV & Smart Home", emoji: "🎛️", blurb: "Audio, TV, automation" },
  { id: "cybersecurity", group: "technology", name: "Cybersecurity", emoji: "🔐", blurb: "Protection and audits" },

  // Creative & Media
  { id: "photography", group: "creative", name: "Photography", emoji: "📷", blurb: "Events and portraits" },
  { id: "videography", group: "creative", name: "Videography & Film", emoji: "🎥", blurb: "Video and drone" },
  { id: "graphic_design", group: "creative", name: "Graphic Design", emoji: "🖌️", blurb: "Logos and artwork" },
  { id: "printing", group: "creative", name: "Printing & Signage", emoji: "🖨️", blurb: "Print, banners, signs" },
  { id: "music", group: "creative", name: "Musicians & Bands", emoji: "🎸", blurb: "Live music and acts" },
  { id: "social_media", group: "creative", name: "Content & Social Media", emoji: "📱", blurb: "Posts and campaigns" },

  // Events
  { id: "event_planning", group: "events", name: "Event Planning", emoji: "🎉", blurb: "Full event management" },
  { id: "weddings", group: "events", name: "Weddings", emoji: "💒", blurb: "Ceremony and reception" },
  { id: "dj", group: "events", name: "DJs & Entertainment", emoji: "🎧", blurb: "Music and hosts" },
  { id: "event_hire", group: "events", name: "Event Hire & Décor", emoji: "🎪", blurb: "Tents, tables, styling" },
  { id: "sound_staging", group: "events", name: "Sound & Staging", emoji: "🔊", blurb: "PA, lights, stage" },
  { id: "florist", group: "events", name: "Florist", emoji: "💐", blurb: "Flowers and bouquets" },

  // Property & Real Estate
  { id: "realtor", group: "property", name: "Real Estate Agents", emoji: "🏡", blurb: "Buy and sell" },
  { id: "property_mgmt", group: "property", name: "Property Management", emoji: "🔑", blurb: "Care for properties" },
  { id: "villa_rental", group: "property", name: "Villa & Holiday Rentals", emoji: "🏝️", blurb: "Short-term stays" },
  { id: "long_rental", group: "property", name: "Long-term Rentals", emoji: "🏠", blurb: "Homes to let" },
  { id: "valuation", group: "property", name: "Valuation & Appraisal", emoji: "📊", blurb: "Property valuations" },

  // Retail
  { id: "grocery", group: "retail", name: "Grocery & Supermarket", emoji: "🛒", blurb: "Food and household" },
  { id: "market_produce", group: "retail", name: "Local Market & Produce", emoji: "🥭", blurb: "Fresh and local" },
  { id: "clothing", group: "retail", name: "Clothing & Fashion", emoji: "👕", blurb: "Apparel and style" },
  { id: "hardware", group: "retail", name: "Hardware & DIY", emoji: "🔩", blurb: "Tools and materials" },
  { id: "electronics_retail", group: "retail", name: "Electronics", emoji: "📱", blurb: "Devices and gadgets" },
  { id: "furniture", group: "retail", name: "Furniture & Home", emoji: "🛋️", blurb: "For the home" },
  { id: "gifts", group: "retail", name: "Gifts & Souvenirs", emoji: "🎁", blurb: "Local gifts" },
  { id: "jewellery", group: "retail", name: "Jewellery & Watches", emoji: "💍", blurb: "Fine and fashion" },

  // Education
  { id: "tutoring", group: "education", name: "Tutoring", emoji: "📚", blurb: "School subjects" },
  { id: "music_lessons", group: "education", name: "Music Lessons", emoji: "🎵", blurb: "Instruments and voice" },
  { id: "driving_school", group: "education", name: "Driving School", emoji: "🚗", blurb: "Learn to drive" },
  { id: "languages", group: "education", name: "Language Classes", emoji: "🗣️", blurb: "Learn a language" },
  { id: "childcare", group: "education", name: "Childcare & Nursery", emoji: "🧸", blurb: "Early years care" },
  { id: "vocational", group: "education", name: "Vocational Training", emoji: "🎓", blurb: "Skills and trades" },

  // Pets
  { id: "vet", group: "pets", name: "Veterinary", emoji: "🐾", blurb: "Animal health" },
  { id: "pet_grooming", group: "pets", name: "Pet Grooming", emoji: "✂️", blurb: "Wash and trim" },
  { id: "pet_sitting", group: "pets", name: "Pet Sitting & Walking", emoji: "🦮", blurb: "Care while away" },
  { id: "pet_supplies", group: "pets", name: "Pet Supplies", emoji: "🦴", blurb: "Food and gear" },

  // Agriculture
  { id: "farming", group: "agriculture", name: "Farming & Produce", emoji: "🌾", blurb: "Crops and growers" },
  { id: "livestock", group: "agriculture", name: "Livestock", emoji: "🐐", blurb: "Animals and husbandry" },
  { id: "fisheries", group: "agriculture", name: "Fisheries", emoji: "🐟", blurb: "Fish and seafood" },
  { id: "plant_nursery", group: "agriculture", name: "Plant Nursery", emoji: "🌱", blurb: "Plants and seedlings" },

  // Manufacturing
  { id: "fabrication", group: "manufacturing", name: "Fabrication & Metalwork", emoji: "🏭", blurb: "Custom metal goods" },
  { id: "food_production", group: "manufacturing", name: "Food & Beverage Production", emoji: "🥤", blurb: "Made locally" },
  { id: "woodwork_make", group: "manufacturing", name: "Woodwork & Furniture Making", emoji: "🪵", blurb: "Bespoke pieces" },
  { id: "textiles", group: "manufacturing", name: "Textiles & Garments", emoji: "🧵", blurb: "Sewing and tailoring" },

  // Government & Public Services
  { id: "utilities", group: "government", name: "Utilities (APUA etc.)", emoji: "🔌", blurb: "Power, water, telecoms" },
  { id: "licensing", group: "government", name: "Licensing & Permits", emoji: "📋", blurb: "Official permissions" },
  { id: "immigration", group: "government", name: "Immigration & Customs", emoji: "🛂", blurb: "Borders and docs" },
  { id: "waste", group: "government", name: "Waste & Sanitation", emoji: "♻️", blurb: "Collection and disposal" },

  // Other
  { id: "other", group: "other", name: "Other Services", emoji: "✨", blurb: "Something else" },
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
// Not every category needs synonyms — provider name/category-name/description token matching covers the rest.
export const CATEGORY_SYNONYMS = {
  electrical: ["electric", "electrical", "electrician", "current man", "current", "wiring", "wire", "socket", "outlet", "breaker", "panel", "light", "lighting", "power", "fuse", "generator", "inverter"],
  plumbing: ["plumber", "plumbing", "leak", "leaking", "fix a leak", "pipe", "pipes", "water", "tank", "cistern", "toilet", "tap", "faucet", "drain", "sink", "shower", "blockage", "burst"],
  ac: ["ac", "a/c", "aircon", "air con", "air-con", "air conditioning", "air conditioner", "ac man", "acman", "refrigeration", "fridge", "freezer", "cooling", "cold room", "split unit"],
  masonry: ["mason", "masonry", "builder", "building", "concrete", "cement", "block", "blocks", "blockwork", "wall", "construction", "plaster", "plastering", "render", "foundation"],
  gardening: ["garden", "gardener", "gardening", "landscaping", "landscaper", "landscape", "lawn", "yard", "grass", "bush", "tree", "trees", "planting", "hedge", "trimming"],
  cleaning: ["clean", "cleaner", "cleaning", "housekeeping", "maid", "deep clean", "turnover", "laundry", "domestic"],
  carpentry: ["carpenter", "carpentry", "joinery", "joiner", "wood", "cabinet", "cabinets", "deck", "door", "doors"],
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
  mechanic: ["mechanic", "car repair", "auto repair", "garage", "engine", "service car", "car service"],
  bodywork: ["bodywork", "body shop", "dent", "dents", "respray", "paint car", "panel beating"],
  tyres: ["tyre", "tyres", "tire", "tires", "puncture", "wheel", "wheels", "balance", "alignment"],
  car_detailing: ["car wash", "detailing", "valet", "wash car"],
  towing: ["tow", "towing", "recovery", "breakdown", "wrecker"],
  taxi: ["taxi", "cab", "driver", "private driver", "ride"],
  airport_transfer: ["airport", "transfer", "airport transfer", "pickup", "drop off"],
  car_rental: ["car rental", "rent a car", "hire car", "vehicle rental", "scooter rental"],
  delivery: ["delivery", "courier", "drop off", "dispatch"],
  boat_repair: ["boat repair", "boat", "marine", "hull", "yacht repair", "bottom job", "antifoul"],
  marine_engine: ["outboard", "marine engine", "inboard", "boat engine"],
  captain: ["captain", "skipper", "crew", "delivery skipper"],
  boat_charter: ["boat charter", "charter", "day charter", "boat trip"],
  diving: ["dive", "diving", "scuba", "snorkel", "snorkelling"],
  tours: ["tour", "tours", "excursion", "excursions", "sightseeing"],
  fishing_charter: ["fishing", "fishing charter", "deep sea", "sport fishing"],
  restaurant: ["restaurant", "food", "eat", "dining", "takeaway", "takeout"],
  catering: ["catering", "caterer", "cater"],
  private_chef: ["private chef", "chef", "personal chef"],
  bakery: ["bakery", "cake", "cakes", "bread", "pastry", "baker"],
  photography: ["photographer", "photography", "photos", "photo", "headshots", "wedding photographer"],
  videography: ["videographer", "video", "film", "drone", "videography"],
  it_support: ["it", "it support", "computer help", "tech support", "helpdesk"],
  web_dev: ["website", "web design", "web developer", "app", "developer"],
  device_repair: ["phone repair", "computer repair", "laptop repair", "screen repair", "device repair"],
  networking: ["wifi", "wi-fi", "network", "internet", "router"],
  legal: ["lawyer", "attorney", "legal", "solicitor", "notary"],
  accounting: ["accountant", "accounting", "bookkeeping", "bookkeeper", "tax return"],
  realtor: ["real estate", "realtor", "estate agent", "property for sale", "buy house"],
  villa_rental: ["villa", "holiday rental", "vacation rental", "airbnb", "short let"],
  vet: ["vet", "veterinary", "veterinarian", "animal doctor"],
  pet_grooming: ["dog grooming", "pet grooming", "groomer"],
  tutoring: ["tutor", "tutoring", "lessons", "teacher", "maths", "extra lessons"],
  event_planning: ["event", "event planner", "party planner", "planner"],
  weddings: ["wedding", "wedding planner", "bride"],
  dj: ["dj", "disc jockey", "entertainment"],
  beauty: ["hair", "hairdresser", "barber", "salon", "nails", "makeup", "beauty"],
  spa: ["spa", "massage", "masseuse", "therapist"],
  fitness: ["gym", "personal trainer", "fitness", "workout", "trainer"],
  farming: ["farm", "farmer", "produce", "vegetables", "crops"],
  fisheries: ["fish", "fisherman", "seafood", "fisheries"],
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
