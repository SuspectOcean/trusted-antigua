import { SITE_URL } from "@/lib/site";

// Public pages are crawlable; account/admin/manage are private and kept out of the index.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/manage"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
