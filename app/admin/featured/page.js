"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { CAT } from "@/lib/categories";

// Editorial highlights. Deliberately separate from advertising.
export default function AdminFeaturedPage() {
  const [rows, setRows] = useState([]);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [draft, setDraft] = useState(null);

  const reload = useCallback(async () => setRows(await api.adminFeatured()), []);
  useEffect(() => { reload(); }, [reload]);

  async function search(e) {
    e.preventDefault();
    if (!q.trim()) { setResults([]); return; }
    setResults(await api.providers({ q: q.trim() }));
  }

  async function save() {
    if (!draft?.provider_id) { setFlash("Pick a provider first."); return; }
    setBusy(true);
    try {
      await api.adminSaveFeatured({
        ...(draft.id ? { id: draft.id } : {}),
        provider_id: draft.provider_id,
        headline: draft.headline?.trim() || null,
        note: draft.note?.trim() || null,
        priority: Number(draft.priority) || 0,
        active: draft.active !== false,
      });
      setDraft(null); setResults([]); setQ(""); setFlash("Saved.");
      await reload();
    } catch (e) { console.error(e); setFlash("Could not save."); }
    finally { setBusy(false); }
  }

  async function toggle(row) {
    setBusy(true);
    try { await api.adminSaveFeatured({ id: row.id, active: !row.active }); await reload(); }
    catch (e) { console.error(e); setFlash("Could not update."); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    setBusy(true);
    try { await api.adminDeleteFeatured(id); setFlash("Removed."); await reload(); }
    catch (e) { console.error(e); setFlash("Could not remove."); }
    finally { setBusy(false); }
  }

  return (
    <AdminShell title="Featured providers" subtitle="Editorial highlights chosen by the team. Never paid placement, never affects ratings.">
      <Flash msg={flash} />

      <Panel
        title="Add a feature"
        action={draft ? <button onClick={() => { setDraft(null); setResults([]); }} className="text-[12px] text-muted underline">Cancel</button> : null}
      >
        {!draft ? (
          <>
            <form onSubmit={search} className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search providers by name or trade" className={inputCls} />
              <button className="shrink-0 px-3 rounded-xl bg-amber text-navy font-semibold text-[13px]">Search</button>
            </form>
            {results.length ? (
              <div className="mt-2 space-y-1.5">
                {results.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setDraft({ provider_id: p.id, name: p.alias || p.name, headline: "", note: "", priority: 0, active: true })}
                    className="w-full text-left bg-surface border border-white/10 rounded-xl p-2.5 hover:border-amber/40"
                  >
                    <span className="text-[14px] text-ink font-medium">{p.alias || p.name}</span>
                    <span className="text-[12px] text-muted"> · {CAT[p.category_id]?.name || p.category_id}{p.area ? ` · ${p.area}` : ""}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="bg-surface border border-teal/30 rounded-2xl p-3 space-y-2">
            <div className="text-[14px] text-ink font-medium">{draft.name || "Selected provider"}</div>
            <input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} placeholder="Headline (e.g. Trusted by neighbours)" className={inputCls} />
            <textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={2} placeholder="Why are you highlighting them?" className={inputCls} />
            <div className="flex gap-2">
              <input value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} type="number" placeholder="Priority" className={inputCls} />
              <button disabled={busy} onClick={save} className="shrink-0 px-4 rounded-xl bg-amber text-navy font-semibold text-[13px] disabled:opacity-60">Save</button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title={`Current features (${rows.length})`}>
        {!rows.length ? <div className="text-[13px] text-muted">Nothing featured yet.</div> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className={`bg-surface border rounded-2xl p-3 ${r.active ? "border-teal/30" : "border-white/10 opacity-60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-ink text-[14px]">{r.providers?.alias || r.providers?.name || "Provider"}</span>
                  <span className="text-[11px] text-muted">priority {r.priority}</span>
                </div>
                {r.headline ? <div className="text-[13px] text-ink mt-0.5">{r.headline}</div> : null}
                {r.note ? <p className="text-[12px] text-muted mt-0.5">{r.note}</p> : null}
                <div className="mt-2 flex gap-2">
                  <button disabled={busy} onClick={() => toggle(r)} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px] disabled:opacity-60">{r.active ? "Deactivate" : "Activate"}</button>
                  <button disabled={busy} onClick={() => setDraft({ id: r.id, provider_id: r.provider_id, name: r.providers?.alias || r.providers?.name, headline: r.headline || "", note: r.note || "", priority: r.priority, active: r.active })} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px] disabled:opacity-60">Edit</button>
                  <button disabled={busy} onClick={() => remove(r.id)} className="px-3 py-1.5 rounded-full border border-err/40 text-err text-[12px] disabled:opacity-60">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
