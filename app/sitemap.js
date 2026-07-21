import { SITE_URL } from "@/lib/site";

// Static routes only for now. Provider pages join the sitemap once they move to
// path-based, server-rendered URLs (query-param URLs are deliberately excluded).
export default function sitemap() {
  const now = new Date();
  const entry = (path, changeFrequency, priority) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    entry("/", "daily", 1),
    entry("/find", "daily", 0.9),
    entry("/recommend", "monthly", 0.5),
    entry("/about", "monthly", 0.4),
    entry("/guidelines", "yearly", 0.3),
    entry("/privacy", "yearly", 0.2),
    entry("/terms", "yearly", 0.2),
  ];
}
