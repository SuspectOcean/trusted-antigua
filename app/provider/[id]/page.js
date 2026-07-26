import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";
import ProviderView from "@/components/ProviderView";

// Server-rendered so crawlers and messaging apps (WhatsApp, Facebook) get a real
// <head> with Open Graph tags — this is what produces a rich link preview when a
// provider URL is pasted into a chat. The interactive UI stays a client component.
export async function generateMetadata({ params }) {
  const id = params?.id;
  let p = null;
  try { p = await api.provider(id); } catch { p = null; }

  if (!p) {
    return {
      title: `Provider · ${SITE_NAME}`,
      description: "Find honest, reviewed tradespeople and service providers in Antigua & Barbuda.",
      alternates: { canonical: `/provider/${id}` },
    };
  }

  const name = p.alias || p.name;
  const cat = CAT[p.category_id]?.name;
  const where = p.area ? ` in ${p.area}` : "";
  const what = cat ? `${cat}${where}, Antigua & Barbuda` : `Service provider${where}, Antigua & Barbuda`;
  const title = `${name} · ${what.replace(", Antigua & Barbuda", "")} | ${SITE_NAME}`;
  const description = p.description
    ? p.description.slice(0, 200)
    : `${name} — ${what}. See reviews and the community Trust Rating on ${SITE_NAME}.`;
  const canonical = `/provider/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      siteName: SITE_NAME,
      title: `${name} · ${what}`,
      description,
      url: canonical,
      ...(p.photo_url ? { images: [{ url: p.photo_url }] } : {}),
    },
    twitter: {
      card: p.photo_url ? "summary_large_image" : "summary",
      title: `${name} · ${what}`,
      description,
      ...(p.photo_url ? { images: [p.photo_url] } : {}),
    },
  };
}

export default function ProviderRoutePage({ params }) {
  return <ProviderView id={params.id} />;
}
