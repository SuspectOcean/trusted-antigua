export const pct = (yes, count) => (count ? Math.round((yes / count) * 100) : 0);

// Reject a promise if it hasn't settled within `ms`, so mobile network stalls
// surface as a handleable error instead of an indefinite loading state.
export function withTimeout(promise, ms = 12000) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), ms)),
  ]);
}

export function waLink(contact) {
  if (!contact) return "";
  const digits = String(contact).replace(/[^\d]/g, "");
  return digits ? "https://wa.me/" + digits : "";
}
