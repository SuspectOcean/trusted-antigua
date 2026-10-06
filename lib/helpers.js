export const pct = (yes, count) => (count ? Math.round((yes / count) * 100) : 0);

// Never let a slow or failed request hang the UI.
//  - withTimeout(p, ms)            rejects on timeout or error (caller handles it).
//  - withTimeout(p, ms, fallback)  resolves to `fallback` on timeout or error.
export function withTimeout(promise, ms = 12000, ...rest) {
  const hasFallback = rest.length > 0;
  const fallback = rest[0];
  const guarded = hasFallback ? Promise.resolve(promise).catch(() => fallback) : Promise.resolve(promise);
  return Promise.race([
    guarded,
    new Promise((resolve, reject) =>
      setTimeout(() => (hasFallback ? resolve(fallback) : reject(new Error("timed out"))), ms)
    ),
  ]);
}

// WhatsApp needs a full international number. Most Antiguan numbers are typed
// locally ("464 1234" or "268 464 1234"), which made dead wa.me links. Add the
// 1-268 country/area code when it is clearly missing; leave anything else alone.
export function waLink(contact) {
  if (!contact) return "";
  let digits = String(contact).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.length === 7) digits = "1268" + digits;
  else if (digits.length === 10 && digits.startsWith("268")) digits = "1" + digits;
  return "https://wa.me/" + digits;
}
