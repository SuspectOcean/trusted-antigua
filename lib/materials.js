// "Who supplies the materials?" vocabulary. One file so the review form, the
// owner page, the profile, the cards and the Find filter all say the same thing.
//
// Two sources, never merged in the UI:
//   provider  what the provider says about themselves (description)
//   customers what reviewers report (reputation, read-only to the provider)
// The database decides which one is the headline: see provider_materials() in
// db/2026-11-14-materials-indicator.sql. Wording stays neutral on purpose. Some
// customers prefer to buy their own materials to control cost.

import { groupOf } from "@/lib/categories";

// Mirror of the constant inside provider_materials(). Display only.
export const MATERIALS_MIN_REPORTS = 3;

export const MATERIALS_STATES = {
  supplies: { label: "Supplies own materials", owner: "I supply the materials" },
  customer: { label: "Customer buys materials", owner: "The customer buys the materials" },
  varies: { label: "Materials vary by job", owner: "It varies by job" },
};
export const MATERIALS_ORDER = ["supplies", "customer", "varies"];

// Reviewer question: "Did you have to buy the materials yourself?"
export const MATERIALS_ANSWERS = [
  { value: "no", label: "No, they supplied them" },
  { value: "partly", label: "Partly" },
  { value: "yes", label: "Yes, I bought them" },
];

// The question only makes sense where a job consumes parts or materials.
// A tutor, a captain or an accountant is never asked.
const MATERIALS_GROUPS = new Set(["building", "home", "marine", "automotive"]);
export const materialsApplies = (categoryIds) =>
  (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).some((c) => MATERIALS_GROUPS.has(groupOf(c)));

// Turn one provider_materials() row into display text. Null when there is
// nothing honest to show.
export function materialsDisplay(m) {
  if (!m || !m.status || !MATERIALS_STATES[m.status]) return null;
  const fromCustomers = m.source === "customers";
  return {
    status: m.status,
    label: MATERIALS_STATES[m.status].label,
    fromCustomers,
    sourceShort: fromCustomers ? `${m.n_reports} customers` : "provider says",
    sourceLong: fromCustomers
      ? `Reported by ${m.n_reports} customers in their reviews.`
      : "Stated by the provider. Not yet confirmed by customer reviews.",
  };
}
