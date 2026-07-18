"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";

const BLANK_CAMPAIGN = { advertiser_name: "", advertiser_contact: "", starts_at: "", ends_at: "", priority: 0, status: "active", notes: "" };

// Managed advertising: we upload the creative, advertisers get no account and no scripts.
export default function AdminAdsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [slots, setSlots] = useState([]);
  const [draft, setDraft] = useState(null);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);

  const reload = useCallback(async () => {
    const [c, s] = await Promise.all([api.adminCampaigns(), api.adminAdSlots()]);
    setCampaigns(c); setSlots(s);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function saveCampaign() {
    if (!draft.advertiser_name.trim()) { setFlash("Advertiser name is required."); return; }
    setBusy(true);
    try {
      await api.adminSaveCampaign({
        ...(draft.id ? { id: draft.id } : {}),
        advertiser_name: draft.advertiser_name.trim(),
        advertiser_contact: draft.advertiser_contact?.trim() || null,
        starts_at: draft.starts_at || null,
        ends_at: draft.ends_at || null,
        priority: Number(draft.priority) || 0,
        status: draft.status || "active",
        notes: draft.notes?.trim() || null,
      });
      setDraft(null); setFlash("Campaign saved."); await reload();
    } catch (e) { console.error(e); setFlash("Could not save campaign."); }
    finally { setBusy(false); }
  }

  async function addCreative(campaignId, file, clickUrl, alt) {
    setBusy(true);
    try {
      const image_url = await api.adminUploadAdImage(file);
      await api.adminSaveCreative({ campaign_id: campaignId, image_url, click_url: clickUrl || null, alt_text: alt || null });
      setFlash("Creative uploaded."); await reload();
    } catch (e) { console.error(e); setFlash("Upload failed. Check you are an admin."); }
    finally { setBusy(false); }
  }

  async function addPlacement(campaignId, slotKey, starts, ends) {
    if (!slotKey) { setFlash("Choose a slot."); return; }
    setBusy(true);
    try {
      await api.adminSavePlacement({ campaign_id: campaignId, slot_key: slotKey, starts_at: starts || null, ends_at: ends || null });
      setFlash("Placement booked."); await reload();
    } catch (e) { console.error(e); setFlash("Could not book placement."); }
    finally { setBusy(false); }
  }

  async function del(kind, id) {
    setBusy(true);
    try {
      if (kind === "campaign") await api.adminDeleteCampaign(id);
      if (kind === "creative") await api.adminDeleteCreative(id);
      if (kind === "placement") await api.adminDeletePlacement(id);
      setFlash("Deleted."); await reload();
    } catch (e) { console.error(e); setFlash("Could not delete."); }
    finally { setBusy(false); }
  }

  return (
    <AdminShell title="Advertisements" subtitle="Direct bookings only. We upload the artwork; adverts never access any platform data.">
      <Flash msg={flash} />

      <Panel
        title={draft?.id ? "Edit campaign" : "New campaign"}
        action={draft
          ? <button onClick={() => setDraft(null)} className="text-[12px] text-muted underline">Cancel</button>
          : <button onClick={() => setDraft({ ...BLANK_CAMPAIGN })} className="px-3 py-1.5 rounded-full bg-amber text-navy font-semibold text-[12px]">Add campaign</button>}
      >
        {draft ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-3 space-y-2">
            <input value={draft.advertiser_name} onChange={(e) => setDraft({ ...draft, advertiser_name: e.target.value })} placeholder="Advertiser name" className={inputCls} />
            <input value={draft.advertiser_contact} onChange={(e) => setDraft({ ...draft, advertiser_contact: e.target.value })} placeholder="Contact (internal only, never shown)" className={inputCls} />
            <div className="flex gap-2">
              <input value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} type="date" className={inputCls} />
              <input value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} type="date" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <input value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} type="number" placeholder="Priority" className={inputCls} />
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={inputCls}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button disabled={busy} onClick={saveCampaign} className="w-full py-2 rounded-xl bg-amber text-navy font-semibold text-[13px] disabled:opacity-60">Save campaign</button>
          </div>
        ) : null}
      </Panel>

      <Panel title={`Campaigns (${campaigns.length})`}>
        {!campaigns.length ? <div className="text-[13px] text-muted">No campaigns yet. House content is filling every slot.</div> : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-surface border border-white/10 rounded-2xl p-3">
                <button onClick={() => setOpenId(openId === c.id ? null : c.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold text-ink text-[14px]">{c.advertiser_name}</span>
                    <span className="text-[11px] text-muted">{c.status} · {(c.ad_creatives || []).length} creative{(c.ad_creatives || []).length === 1 ? "" : "s"} · {(c.ad_placements || []).length} placement{(c.ad_placements || []).length === 1 ? "" : "s"}</span>
                  </div>
                </button>

                {openId === c.id ? (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    <CreativeAdder busy={busy} onAdd={(f, u, a) => addCreative(c.id, f, u, a)} />
                    {(c.ad_creatives || []).map((cr) => (
                      <div key={cr.id} className="flex items-center gap-2 bg-surface2 rounded-xl p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cr.image_url} alt="" className="w-16 h-10 object-cover rounded" />
                        <span className="text-[11px] text-muted truncate flex-1">{cr.click_url || "no link"}</span>
                        <button disabled={busy} onClick={() => del("creative", cr.id)} className="text-[11px] text-err underline">Delete</button>
                      </div>
                    ))}

                    <PlacementAdder slots={slots} busy={busy} onAdd={(s, st, en) => addPlacement(c.id, s, st, en)} />
                    {(c.ad_placements || []).map((pl) => (
                      <div key={pl.id} className="flex items-center gap-2 bg-surface2 rounded-xl p-2">
                        <span className="text-[12px] text-ink flex-1">{pl.slot_key}</span>
                        <span className="text-[11px] text-muted">{pl.starts_at ? String(pl.starts_at).slice(0, 10) : "now"} → {pl.ends_at ? String(pl.ends_at).slice(0, 10) : "open"}</span>
                        <button disabled={busy} onClick={() => del("placement", pl.id)} className="text-[11px] text-err underline">Remove</button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => setDraft({ ...c, starts_at: c.starts_at ? String(c.starts_at).slice(0, 10) : "", ends_at: c.ends_at ? String(c.ends_at).slice(0, 10) : "" })} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px]">Edit campaign</button>
                      <button disabled={busy} onClick={() => del("campaign", c.id)} className="px-3 py-1.5 rounded-full border border-err/40 text-err text-[12px]">Delete campaign</button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Slots">
        <div className="space-y-1.5">
          {slots.map((s) => (
            <div key={s.key} className="bg-surface2 rounded-xl p-2.5 text-[12px] text-slate2">
              <b className="text-ink">{s.name}</b> · <span className="text-muted">{s.key} · {s.width}×{s.height}</span>
            </div>
          ))}
        </div>
      </Panel>
    </AdminShell>
  );
}

function CreativeAdder({ onAdd, busy }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-semibold text-ink">Add creative (image only)</div>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[12px] text-slate2" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Destination link" className={inputCls} />
      <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text" className={inputCls} />
      <button disabled={busy || !file} onClick={() => onAdd(file, url, alt)} className="px-3 py-1.5 rounded-full bg-amber text-navy font-semibold text-[12px] disabled:opacity-50">Upload creative</button>
    </div>
  );
}

function PlacementAdder({ slots, onAdd, busy }) {
  const [slot, setSlot] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-semibold text-ink">Book a slot</div>
      <select value={slot} onChange={(e) => setSlot(e.target.value)} className={inputCls}>
        <option value="">Choose a slot…</option>
        {slots.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
      </select>
      <div className="flex gap-2">
        <input value={starts} onChange={(e) => setStarts(e.target.value)} type="date" className={inputCls} />
        <input value={ends} onChange={(e) => setEnds(e.target.value)} type="date" className={inputCls} />
      </div>
      <button disabled={busy} onClick={() => onAdd(slot, starts, ends)} className="px-3 py-1.5 rounded-full bg-amber text-navy font-semibold text-[12px] disabled:opacity-50">Book placement</button>
    </div>
  );
}
