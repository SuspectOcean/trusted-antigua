"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";

// Private concerns: members send these from a provider profile ("Share a
// private concern"). They never appear in public and never touch a rating.
// This queue is the only place they are read. Resolving records who and when,
// with an optional note, so there is an audit record of what was done.
export default function AdminConcernsPage() {
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setRows(await api.adminPrivateWarnings(tab));
    setLoading(false);
  }, [tab]);
  useEffect(() => { reload(); }, [reload]);

  async function resolve(id, reopen) {
    setBusyId(id);
    try {
      await api.adminResolvePrivateWarning(id, notes[id] || null, reopen);
      setFlash(reopen ? "Concern reopened." : "Concern marked resolved.");
      await reload();
    } catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  return (
    <AdminShell title="Concerns" subtitle="Private concerns sent by members. Never public, never part of a rating.">
      <Flash msg={flash} />

      <div className="mt-3 flex gap-2">
        {["open", "resolved"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[13px] px-3 py-1.5 rounded-full border ${tab === t ? "bg-amber text-navy border-amber font-medium" : "bg-surface2 text-ink border-white/15"}`}>
            {t === "open" ? "Open" : "Resolved"}
          </button>
        ))}
      </div>

      <Panel title={`${tab === "open" ? "Open" : "Resolved"} (${rows.length})`}>
        {loading ? <div className="text-[13px] text-muted">Loading…</div>
          : !rows.length ? <div className="text-[13px] text-muted">Nothing here.</div> : (
          <div className="space-y-2.5">
            {rows.map((w) => (
              <div key={w.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {w.provider_id
                      ? <Link href={`/provider?id=${encodeURIComponent(w.provider_id)}`} className="font-display font-semibold text-ink">{w.provider_name || "Provider"}</Link>
                      : <span className="font-display font-semibold text-ink">{w.provider_name || "No provider attached"}</span>}
                    <div className="text-[12px] text-muted mt-0.5">
                      {String(w.created_at || "").slice(0, 16).replace("T", " ")}
                      {w.resolved_at ? ` · resolved ${String(w.resolved_at).slice(0, 10)}` : ""}
                    </div>
                  </div>
                </div>
                <p className="text-[14px] text-slate2 mt-2 whitespace-pre-wrap">{w.warning}</p>
                {w.admin_note ? <div className="mt-2 text-[12px] text-muted">Note: {w.admin_note}</div> : null}
                {tab === "open" ? (
                  <>
                    <input value={notes[w.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [w.id]: e.target.value }))}
                      className={`${inputCls} mt-3`} placeholder="Note (optional): what was done" />
                    <div className="mt-2 flex gap-2">
                      <button disabled={busyId === w.id} onClick={() => resolve(w.id, false)} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Mark resolved</button>
                      {w.provider_id ? <Link href={`/admin/providers`} className="flex-1 text-center py-2 rounded-full border border-white/15 text-ink text-[13px]">Providers</Link> : null}
                    </div>
                  </>
                ) : (
                  <div className="mt-3">
                    <button disabled={busyId === w.id} onClick={() => resolve(w.id, true)} className="w-full py-2 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Reopen</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
