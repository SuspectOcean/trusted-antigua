import { SITE_URL } from "@/lib/site";
import { api } from "@/lib/data";

// Static routes plus every provider's path-based page. Provider pages are now
// server-rendered at /provider/[id], so they're safe to index and share.
export default async function sitemap() {
  const now = new Date();
  const entry = (path, changeFrequency, priority, lastModified = now) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const staticRoutes = [
    entry("/", "daily", 1),
    entry("/find", "daily", 0.9),
    entry("/recommend", "monthly", 0.5),
    entry("/about", "monthly", 0.4),
    entry("/guidelines", "yearly", 0.3),
    entry("/privacy", "yearly", 0.2),
    entry("/terms", "yearly", 0.2),
  ];

  let providers = [];
  try { providers = await api.providers(); } catch { providers = []; }
  const providerRoutes = (providers || []).map((p) =>
    entry(`/provider/${p.id}`, "weekly", 0.6, p.created_at ? new Date(p.created_at) : now)
  );

  return [...staticRoutes, ...providerRoutes];
}
