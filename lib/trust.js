// Trust progression ladder. v1 actively assigns: listed, claimed, verified_business.
// The remaining stages are reserved for future features (no code assigns them yet).
export const TRUST_ORDER = [
  "listed",
  "claimed",
  "verified_business",
  "community_trusted",
  "verified_jobs",
  "trusted_professional",
  "trusted_business",
];

export const TRUST = {
  listed: { label: "Listed", chip: null },
  claimed: { label: "Claimed", chip: "Claimed", tone: "slate" },
  verified_business: { label: "Verified Business", chip: "Verified Business", tone: "amber" },
  community_trusted: { label: "Community Trusted", chip: "Community Trusted", tone: "teal" },
  verified_jobs: { label: "Verified Jobs", chip: "Verified Jobs", tone: "teal" },
  trusted_professional: { label: "Trusted Professional", chip: "Trusted Professional", tone: "amber" },
  trusted_business: { label: "Trusted Business", chip: "Trusted Business", tone: "amber" },
};

// Customer-facing explainer. We never expose the verification method.
export const BADGE_EXPLAINER = "This provider has successfully claimed ownership of this profile.";

export const isClaimed = (level) => level && level !== "listed";
export const isVerified = (level) => TRUST_ORDER.indexOf(level) >= TRUST_ORDER.indexOf("verified_business");
