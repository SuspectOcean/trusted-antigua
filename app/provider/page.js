import { redirect } from "next/navigation";

// Legacy query-param URLs (/provider?id=X) now redirect to the path-based,
// server-rendered route (/provider/X). Keeps every old link and bookmark working,
// and consolidates ranking signals on the canonical path URL.
export default function LegacyProviderRedirect({ searchParams }) {
  const id = searchParams?.id;
  redirect(id ? `/provider/${encodeURIComponent(id)}` : "/find");
}
