"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { SITE_NAME, SITE_URL, OPERATOR, LEGAL_EMAIL, LEGAL_EFFECTIVE_DATE } from "@/lib/site";
import { GROUPS, CATEGORIES } from "@/lib/categories";

function Row({ label, value, note }) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="text-[13px] text-ink text-right truncate">{value}</span>
      </div>
      {note ? <div className="text-[11px] text-muted mt-0.5">{note}</div> : null}
    </div>
  );
}

// Read-only for now: shows the values that drive the live site and where each is set.
export default function AdminSettingsPage() {
  const [slots, setSlots] = useState([]);
  useEffect(() => { api.adminAdSlots().then(setSlots); }, []);

  return (
    <AdminShell title="Site settings" subtitle="Current configuration. Values marked in code are changed in a deploy, not here.">
      <Panel title="Identity">
        <div className="space-y-1.5">
          <Row label="Site name" value={SITE_NAME} />
          <Row label="Site URL" value={SITE_URL} note="Single constant driving canonical URLs, OG tags, sitemap and robots." />
          <Row label="Operator" value={OPERATOR} note="Shown on the legal pages." />
          <Row label="Public contact" value={LEGAL_EMAIL || "Hidden until domain email exists"} note="Set LEGAL_EMAIL in lib/site.js to publish it everywhere at once." />
          <Row label="Legal effective date" value={LEGAL_EFFECTIVE_DATE} />
        </div>
      </Panel>

      <Panel title="Authentication">
        <div className="space-y-1.5">
          <Row label="Magic link" value="Enabled" note="Primary sign-in today." />
          <Row label="Google" value="Disabled" note="Code is ready; flip ENABLED.google once the Google provider is configured in Supabase." />
          <Row label="Admin access" value="Allowlist (admins table)" note="Managed from the Users section." />
        </div>
      </Panel>

      <Panel title="Taxonomy">
        <div className="space-y-1.5">
          <Row label="Groups" value={String(GROUPS.length)} />
          <Row label="Categories" value={String(CATEGORIES.length)} note="Two levels: group → category, plus optional secondary categories per provider." />
        </div>
      </Panel>

      <Panel title="Advertising slots">
        <div className="space-y-1.5">
          {slots.length
            ? slots.map((s) => <Row key={s.key} label={s.name} value={`${s.width}×${s.height}`} note={s.key} />)
            : <div className="text-[13px] text-muted">No slots configured.</div>}
        </div>
      </Panel>
    </AdminShell>
  );
}
