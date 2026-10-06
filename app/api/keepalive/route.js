// Daily heartbeat, called by the Vercel cron in vercel.json.
// A free Supabase project is paused after 7 days without database activity,
// which takes the whole directory offline. One tiny public read a day prevents
// that. Reads only the public stats view with the publishable key: no secrets,
// no user data, nothing written.
export const dynamic = "force-dynamic";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qyvtbftapmdrxrzctunt.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_2iWH9Ca-QbkERW474KTMng_SJtGh_Fq";

export async function GET() {
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/providers?select=id&limit=1`, {
      headers: { apikey: KEY },
      cache: "no-store",
    });
    return Response.json({ ok: r.ok, status: r.status, at: new Date().toISOString() }, { status: r.ok ? 200 : 503 });
  } catch (e) {
    return Response.json({ ok: false, error: "unreachable", at: new Date().toISOString() }, { status: 503 });
  }
}
