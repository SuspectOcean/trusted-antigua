import { createClient } from "@supabase/supabase-js";

// Publishable key is safe to be public (row-level security protects the data).
// Values come from Vercel env vars; the fallbacks keep local builds working.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qyvtbftapmdrxrzctunt.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_2iWH9Ca-QbkERW474KTMng_SJtGh_Fq";

// Sessions persist on the device (refresh token in localStorage) and renew
// automatically, so signing in is once per device, not once per visit.
// These are Supabase defaults, pinned explicitly so nobody "optimises" them away.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
