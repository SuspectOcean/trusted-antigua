export const pct = (yes, count) => (count ? Math.round((yes / count) * 100) : 0);

export function waLink(contact) {
  if (!contact) return "";
  const digits = String(contact).replace(/[^\d]/g, "");
  return digits ? "https://wa.me/" + digits : "";
}
