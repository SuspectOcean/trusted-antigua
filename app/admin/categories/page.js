"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, Flash } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { CAT, GROUPS, categoriesInGroup } from "@/lib/categories";

// Change requests plus a read-only view of the taxonomy that ships in code.
export default function AdminCategoriesPage() {
  const [reqs, setReqs] = useState([]);
  const [sugg, setSugg] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  const reload = useCallback(async () => {
    setReqs(await api.adminCategoryRequests("pending"));
    setSugg(await api.adminCategorySuggestions());
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function decide(id, approve) {
    setBusyId(id);
    try { await api.adminDecideCategory(id, approve, null); setFlash(approve ? "Category updated." : "Request rejected."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  async function resolveSugg(id, status) {
    setBusyId(id);
    try { await api.adminResolveSuggestion(id, status); setFlash(status === "added" ? "Marked as added." : "Suggestion dismissed."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  const pendingSugg = sugg.filter((s) => s.status === "pending");

  return (
    <AdminShell title="Categories" subtitle="Change requests, and the group to category taxonomy the whole site uses.">
      <Flash msg={flash} />

      <Panel title={`Change requests (${reqs.length})`}>
        {!reqs.length ? <div className="text-[13px] text-muted">Nothing waiting.</div> : (
          <div className="space-y-2.5">
            {reqs.map((k) => (
              <div key={k.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <Link href={`/provider?id=${encodeURIComponent(k.provider_id)}`} className="font-display font-semibold text-ink">{k.providers?.alias || k.providers?.name}</Link>
                <div className="text-[13px] text-slate2 mt-1">{CAT[k.current_category]?.name || k.current_category} → <b>{CAT[k.requested_category]?.name || k.requested_category}</b></div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === k.id} onClick={() => decide(k.id, true)} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Approve</button>
                  <button disabled={busyId === k.id} onClick={() => decide(k.id, false)} className="flex-1 py-2 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`Suggested trades (${pendingSugg.length})`}>
        <p className="text-[12px] text-muted mb-2">Trades people proposed that aren&apos;t in the taxonomy yet. The provider is listed under &ldquo;Other&rdquo; meanwhile. Approving here flags it to add to the taxonomy on the next deploy.</p>
        {!pendingSugg.length ? <div className="text-[13px] text-muted">No suggestions waiting.</div> : (
          <div className="space-y-2.5">
            {pendingSugg.map((s) => (
              <div key={s.id} className="bg-surface border border-amber/30 rounded-2xl p-4 shadow-card">
                <div className="font-display font-semibold text-ink">&ldquo;{s.suggested_name}&rdquo;</div>
                <div className="text-[12px] text-slate2 mt-0.5">
                  {s.provider_id
                    ? <>for <Link href={`/provider/${s.provider_id}`} className="text-amber underline">{s.provider_name || "a provider"}</Link></>
                    : "general suggestion"}
                  <span className="text-muted"> · {String(s.created_at).slice(0, 10)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === s.id} onClick={() => resolveSugg(s.id, "added")} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Mark added</button>
                  <button disabled={busyId === s.id} onClick={() => resolveSugg(s.id, "dismissed")} className="flex-1 py-2 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`Taxonomy (${GROUPS.length} groups)`}>
        <p className="text-[12px] text-muted mb-2">The taxonomy is held in code so every provider, filter and URL stays consistent. Changing it is a deploy, not a database edit.</p>
        <div className="space-y-1.5">
          {GROUPS.map((g) => {
            const cats = categoriesInGroup(g.id);
            const open = openGroup === g.id;
            return (
              <div key={g.id} className="bg-surface border border-white/10 rounded-xl p-2.5">
                <button onClick={() => setOpenGroup(open ? null : g.id)} className="w-full flex items-center justify-between gap-2 text-left">
                  <span className="text-[13px] text-ink">{g.emoji ? `${g.emoji} ` : ""}{g.name}</span>
                  <span className="text-[11px] text-muted">{cats.length}</span>
                </button>
                {open ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cats.map((c) => (
                      <span key={c.id} className="text-[11px] text-slate2 bg-surface2 border border-white/10 rounded-full px-2 py-0.5">{c.name}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>
    </AdminShell>
  );
}
