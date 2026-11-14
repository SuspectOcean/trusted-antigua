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

// Second reviewer question, asked only when the provider supplied some or all
// of the materials: "Were you shown the receipts?"
export const RECEIPT_ANSWERS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Materials supply fee: covers the provider buying the materials with their own
// money on the customer's behalf, sourcing, collecting and delivering them to
// the job. The provider types their own percentage; the
// platform sets no rate. Above this the owner page shows a caution.
export const FEE_WARN_ABOVE = 25;
// The provider's fee and receipts terms only apply when they supply materials.
export const feeApplies = (declared) => declared === "supplies" || declared === "varies";

// The provider's stated pricing rule for materials, in plain words. Null when
// they have not stated a fee.
export function materialsTerms(m) {
  if (!m || !feeApplies(m.declared) || m.fee_pct == null) return null;
  const fee = Number(m.fee_pct);
  return {
    fee,
    line: fee > 0
      ? `Materials are charged at receipt cost plus ${fee}%. This covers the provider paying for the materials up front, sourcing them and bringing them to the job.`
      : "Materials are charged at receipt cost, with no supply fee.",
    // 200 at 15% becomes 230. Shown so the sum is never a surprise.
    example: fee > 0 ? `Example: a receipt for 200 is charged at ${Math.round(200 * (1 + fee / 100))}.` : null,
    receipts: m.receipts === true ? "Receipts are shown to the customer." : m.receipts === false ? "Receipts are not shown." : null,
  };
}

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
