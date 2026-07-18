"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";

const BLANK = { title: "", description: "", icon: "", cta_text: "", href: "", priority: 0, slot_key: "", active: true };

// House content fills any advertising slot when no advert is booked.
export default function AdminHousePage() {
  const [rows, setRows] = useState([]);
  const [slots, setSlots] = useState([]);
  const [draft, setDraft] = useState(null);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [r, s] = await Promise.all([api.adminHouseCards(), api.adminAdSlots()]);
    setRows(r); setSlots(s);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function save() {
    if (!draft.title.trim()) { setFlash("A title is required."); return; }
    setBusy(true);
    try {
      await api.adminSaveHouseCard({
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title.trim(),
        description: draft.description?.trim() || null,
        icon: draft.icon?.trim() || null,
        cta_text: draft.cta_text?.trim() || null,
        href: draft.href?.trim() || null,
        priority: Number(draft.priority) || 0,
        slot_key: draft.slot_key || null,
        active: draft.active !== false,
      });
      setDraft(null); setFlash("Saved."); await reload();
    } catch (e) { console.error(e); setFlash("Could not save."); }
    finally { setBusy(false); }
  }

  async function toggle(row) {
    setBusy(true);
    try { await api.adminSaveHouseCard({ id: row.id, active: !row.active }); await reload(); }
    catch (e) { console.error(e); setFlash("Could not update."); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    setBusy(true);
    try { await api.adminDeleteHouseCard(id); setFlash("Deleted."); await reload(); }
    catch (e) { console.error(e); setFlash("Could not delete."); }
    finally { setBusy(false); }
  }

  return (
    <AdminShell title="House content" subtitle="Our own cards. They fill any advertising slot that has no live advert.">
      <Flash msg={flash} />

      <Panel
        title={draft?.id ? "Edit card" : "New card"}
        action={draft
          ? <button onClick={() => setDraft(null)} className="text-[12px] text-muted underline">Cancel</button>
          : <button onClick={() => setDraft({ ...BLANK })} className="px-3 py-1.5 rounded-full bg-amber text-navy font-semibold text-[12px]">Add card</button>}
      >
        {draft ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-3 space-y-2">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className={inputCls} />
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} placeholder="Description" className={inputCls} />
            <div className="flex gap-2">
              <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="Icon (emoji)" className={inputCls} />
              <input value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} type="number" placeholder="Priority" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <input value={draft.cta_text} onChange={(e) => setDraft({ ...draft, cta_text: e.target.value })} placeholder="CTA text (optional)" className={inputCls} />
              <input value={draft.href} onChange={(e) => setDraft({ ...draft, href: e.target.value })} placeholder="Link (optional)" className={inputCls} />
            </div>
            <select value={draft.slot_key || ""} onChange={(e) => setDraft({ ...draft, slot_key: e.target.value })} className={inputCls}>
              <option value="">Any slot</option>
              {slots.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
            <button disabled={busy} onClick={save} className="w-full py-2 rounded-xl bg-amber text-navy font-semibold text-[13px] disabled:opacity-60">Save card</button>
          </div>
        ) : null}
      </Panel>

      <Panel title={`Cards (${rows.length})`}>
        {!rows.length ? <div className="text-[13px] text-muted">No house cards yet.</div> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className={`bg-surface border rounded-2xl p-3 ${r.active ? "border-white/10" : "border-white/10 opacity-55"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] text-ink font-medium">{r.icon ? `${r.icon} ` : ""}{r.title}</span>
                  <span className="text-[11px] text-muted">{r.slot_key || "any slot"} · p{r.priority}</span>
                </div>
                {r.description ? <p className="text-[12px] text-muted mt-0.5">{r.description}</p> : null}
                {r.cta_text && r.href ? <div className="text-[11px] text-amber mt-1">{r.cta_text} → {r.href}</div> : null}
                <div className="mt-2 flex gap-2">
                  <button disabled={busy} onClick={() => toggle(r)} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px] disabled:opacity-60">{r.active ? "Deactivate" : "Activate"}</button>
                  <button disabled={busy} onClick={() => setDraft({ ...r, priority: r.priority ?? 0, slot_key: r.slot_key || "" })} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px] disabled:opacity-60">Edit</button>
                  <button disabled={busy} onClick={() => remove(r.id)} className="px-3 py-1.5 rounded-full border border-err/40 text-err text-[12px] disabled:opacity-60">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
