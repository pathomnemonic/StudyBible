import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { downloadEdition, downloadPack, getManifest, verifyPack, isEditionCached, packCachedCount, packStillCached, type StudyPack } from '../data/loader';
import { BOOKS } from '../lib/canon';
import { useSettings } from '../lib/store';
import { getBiay, type BiayEpisode } from '../data/content';
import { estimateBytes, fmtBytes, removeAllAudio, removeAudio, saveAudio, SaveError, useSaved } from '../lib/offlineAudio';
import { Tip } from '../components/Hints';

const DATA_CACHE = 'studybible-data-v1';
type Man = { packs: StudyPack[]; editions?: Record<string, { sizes: Record<string, number> }> };
const sum = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);

async function evict(match: (path: string) => boolean) {
  try { const c = await caches.open(DATA_CACHE); for (const k of await c.keys()) if (match(new URL(k.url).pathname)) await c.delete(k); } catch { /* none */ }
}

/** One place for everything saved on this device: Bibles, study data and audio, with real sizes, one-tap downloads and a clear way to remove each. */
export default function DownloadsPage() {
  const { editions } = useEditions();
  const [s] = useSettings();
  const saved = useSaved();
  const [man, setMan] = useState<Man | null>(null);
  const [ed, setEd] = useState<Record<string, boolean>>({});
  const [pk, setPk] = useState<Record<string, boolean>>({});
  const [pkc, setPkc] = useState<Record<string, { have: number; total: number }>>({});
  const savedOn = (key: string) => { try { const t = Number(localStorage.getItem(`sb:dl:${key}`)); return t ? new Date(t).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''; } catch { return ''; } };
  const [prog, setProg] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  const [all, setAll] = useState('');
  const [msg, setMsg] = useState('');
  const abort = useRef<AbortController | null>(null);
  const online = typeof navigator === 'undefined' || navigator.onLine;
  const conn = (navigator as unknown as { connection?: { type?: string; saveData?: boolean } }).connection;
  const metered = conn?.type === 'cellular' || conn?.saveData === true;

  const refresh = () => {
    navigator.storage?.estimate?.().then((e) => setEst({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => {});
    getManifest().then((m) => { setMan(m as Man); (m?.packs ?? []).forEach((p) => { packStillCached(p).then((ok) => setPk((x) => ({ ...x, [p.id]: ok }))); packCachedCount(p).then((c) => setPkc((x) => ({ ...x, [p.id]: c }))); }); }).catch(() => {});
    editions.forEach((e) => isEditionCached(e.id, BOOKS.map((b) => b.id)).then((c) => setEd((x) => ({ ...x, [e.id]: c }))));
  };
  useEffect(refresh, [editions]);

  const note = (k: string, v: string) => setErr((x) => ({ ...x, [k]: v }));
  const getEdition = async (id: string) => {
    note(id, ''); abort.current = new AbortController();
    try { await downloadEdition(id, BOOKS.map((b) => b.id), (d, t) => setProg((p) => ({ ...p, [id]: `${Math.round((100 * d) / t)}%` })), abort.current.signal); setEd((x) => ({ ...x, [id]: true })); try { localStorage.setItem(`sb:dl:e:${id}`, String(Date.now())); } catch { /* storage blocked */ } }
    catch (e) { note(id, (e as Error).message); }
    setProg((p) => ({ ...p, [id]: '' })); refresh();
  };
  const getPack = async (p: StudyPack) => {
    note(p.id, ''); abort.current = new AbortController();
    try {
      const r = await downloadPack(p, (_d, _t, b, tb) => setProg((x) => ({ ...x, [p.id]: tb ? `${Math.round((100 * b) / tb)}%` : '…' })), abort.current.signal);
      const ok = !r.failed.length && !r.corrupt.length && !r.cancelled && !r.storageFull;
      setPk((x) => ({ ...x, [p.id]: ok }));
      if (ok) { try { localStorage.setItem(`sb:dl:${p.id}`, String(Date.now())); } catch { /* storage blocked */ } }
      note(p.id, r.cancelled ? 'Stopped. Start again to carry on where it left off.' : r.storageFull ? 'This device is out of room for this site. Remove something and try again.' : r.corrupt.length ? `${r.corrupt.length} files did not match and may be damaged. Try again.` : r.failed.length ? `${r.failed.length} of ${p.files.length} files could not be fetched. Are you offline? Try again.` : '');
    } catch (e) { note(p.id, (e as Error).message); }
    setProg((x) => ({ ...x, [p.id]: '' })); refresh();
  };
  const dropPack = async (p: StudyPack) => { await evict((path) => p.files.some((f) => path.endsWith(`/data/${f}`) || path.endsWith(`/${f}`))); try { localStorage.removeItem(`pack.${p.id}`); } catch { /* none */ } setPk((x) => ({ ...x, [p.id]: false })); refresh(); };
  const dropEdition = async (id: string) => { await evict((path) => path.includes(`/bible/${id}/`)); setEd((x) => ({ ...x, [id]: false })); refresh(); };

  const shown = editions.filter((e) => !e.offByDefault || e.id === s.defaultEdition || ed[e.id]);
  const everything = async () => {
    if (!man) return;
    setAll('starting'); setMsg('');
    const todo: (() => Promise<void>)[] = [];
    const def = editions.find((e) => e.id === s.defaultEdition);
    if (def && def.offlineAllowed && !ed[def.id]) todo.push(() => getEdition(def.id));
    for (const p of [...man.packs].sort((a, b) => a.bytes - b.bytes)) if (!pk[p.id]) todo.push(() => getPack(p));
    for (let i = 0; i < todo.length; i++) { setAll(`${i + 1} of ${todo.length}`); await todo[i](); if (abort.current?.signal.aborted) break; }
    setAll(''); setMsg(abort.current?.signal.aborted ? 'Stopped.' : todo.length ? 'Done. Your Bible and study data are now on this device.' : 'Everything was already on this device.');
    refresh();
  };

  // the next few Bible in a Year episodes, saved in one go
  const [yearBusy, setYearBusy] = useState('');
  const saveYear = async (n: number) => {
    setYearBusy('Finding episodes…'); setMsg('');
    try {
      const b = await getBiay();
      const today = new Date().toISOString().slice(0, 10);
      const days = (b?.episodes ?? []).filter((e: BiayEpisode) => e.kind === 'day' && e.audio);
      const yr = Math.max(...days.map((e) => e.year ?? 0));
      const list = days.filter((e) => e.year === yr && e.date >= today).sort((a, c) => a.date.localeCompare(c.date));
      const next = (list.length ? list : days.filter((e) => e.year === yr).slice(-n)).slice(0, n);
      let i = 0, failed = '';
      for (const e of next) {
        i++; setYearBusy(`Saving ${i} of ${next.length}…`);
        if (saved.some((x) => x.id === e.id)) continue;
        try { await saveAudio(e, (g, t) => setYearBusy(`Saving ${i} of ${next.length}: ${Math.round((100 * g) / t)}%`)); }
        catch (er) { failed = (er as SaveError).message; break; }
      }
      setMsg(failed || `Saved ${next.length} episodes.`);
    } catch { setMsg('Could not load the episode list.'); }
    setYearBusy('');
  };

  const [check, setCheck] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const runCheck = async () => {
    if (!man) return;
    setChecking(true); setCheck(null);
    const out: string[] = [];
    for (const p of man.packs) { if (!pk[p.id]) continue; const r = await verifyPack(p); if (r.bad.length) out.push(`${p.label}: ${r.bad.length} of ${p.files.length} saved ${r.bad.length === 1 ? 'file is' : 'files are'} missing or unreadable`); }
    setCheck(out); setChecking(false);
  };
  const dataBytes = (man?.packs ?? []).reduce((n, p) => n + p.bytes, 0);
  const audioBytes = saved.reduce((n, x) => n + x.bytes, 0);
  return (
    <div className="page downloads">
      <h1>Downloads and offline</h1>
      <Tip id="downloads" title="Save things for the plane, the retreat or the road">Bibles and study data are small. Audio is large (about 1 MB a minute), so save only what you will use.</Tip>
      <p className="lede">Everything saved on this device, with the real size of each, when it was saved, what is missing, and a way to remove it.</p>
      {man && (
        <p className="card small" role="status" aria-label="What is saved">
          <strong>On this device:</strong> {editions.filter((e) => ed[e.id]).length} of {editions.length} Bibles, {(man.packs ?? []).filter((x) => pk[x.id]).length} of {(man.packs ?? []).length} study-data packs{(man.packs ?? []).some((x) => !pk[x.id] && (pkc[x.id]?.have ?? 0) > 0) ? ' (some only partly saved)' : ''}, {saved.length} audio {saved.length === 1 ? 'episode' : 'episodes'}.
        </p>
      )}

      {man && (() => {
        const def = editions.find((e) => e.id === s.defaultEdition);
        const missing: { label: string; act?: () => void }[] = [];
        if (def && def.offlineAllowed && !ed[def.id]) missing.push({ label: `${def.name} (your Bible) is not saved`, act: () => void getEdition(def.id) });
        for (const p of man.packs) { const c = pkc[p.id]; if (!pk[p.id] && c && c.have > 0) missing.push({ label: `${p.label} is only partly saved`, act: () => void getPack(p) }); }
        const ready = missing.length === 0;
        return (
          <section className="card" aria-label="Offline readiness">
            <h2 className="card-title">Ready for a flight? {ready ? 'Yes' : 'Not yet'}</h2>
            {ready
              ? <p className="small">Your Bible is saved on this device and no study pack is half-saved. Audio and video still need a connection unless you saved the episodes in the lists that follow.</p>
              : <ul className="dl-list">{missing.map((m) => <li key={m.label}><span>{m.label}</span>{m.act && <span className="dl-act"><button className="btn small" onClick={m.act}>Save it now</button></span>}</li>)}</ul>}
          </section>
        );
      })()}

      <section className="card">
        <h2 className="card-title">Space</h2>
        <p className="small">{est ? <>This app uses <strong>{fmtBytes(est.usage)}</strong> of the <strong>{fmtBytes(est.quota)}</strong> the browser allows. Saved audio: <strong>{fmtBytes(audioBytes)}</strong>.</> : 'This browser does not say how much room is left.'}</p>
        {est && <div className="goal-bar" role="progressbar" aria-valuenow={Math.round((100 * est.usage) / Math.max(1, est.quota))} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used"><i style={{ width: `${Math.min(100, (100 * est.usage) / Math.max(1, est.quota))}%` }} /></div>}
        <p className="muted small">Your notes and highlights take almost nothing. <Link to="/settings">Storage and backup</Link> shows whether the browser has promised to keep them.</p>
      </section>

      {(() => {
        const items: { key: string; label: string; bytes: number; drop: () => void }[] = [
          ...editions.filter((e) => ed[e.id]).map((e) => ({ key: `e:${e.id}`, label: e.name, bytes: sum(man?.editions?.[e.id]?.sizes), drop: () => void dropEdition(e.id) })),
          ...(man?.packs ?? []).filter((p) => pk[p.id]).map((p) => ({ key: `p:${p.id}`, label: p.label, bytes: p.bytes, drop: () => void dropPack(p) })),
          ...saved.map((x) => ({ key: `a:${x.id}`, label: x.title, bytes: x.bytes, drop: () => void removeAudio(x.id, x.audio) })),
        ].sort((a, b) => b.bytes - a.bytes);
        if (!items.length) return null;
        const total = items.reduce((n, x) => n + x.bytes, 0);
        return (
          <section className="card">
            <h2 className="card-title">Free up space</h2>
            <p className="small">What you have saved, biggest first: {fmtBytes(total)} in all. Removing something never touches your notes, highlights or progress, and you can download it again later.</p>
            <ul className="dl-list">
              {items.slice(0, 6).map((x) => <li key={x.key}><span>{x.label} <span className="muted small">{fmtBytes(x.bytes)}</span></span><span className="dl-act"><button className="btn small ghost" onClick={() => { if (confirm(`Remove “${x.label}” (${fmtBytes(x.bytes)}) from this device?`)) x.drop(); }}>Remove</button></span></li>)}
            </ul>
          </section>
        );
      })()}

      <section className="card" aria-label="Check saved copies">
        <h2 className="card-title">Check what is saved</h2>
        <p className="muted small">Reads each saved study pack back from this device and tells you if a file is missing, cut off or damaged. It changes nothing; use “Save it now” on a pack to fetch it again.</p>
        <button className="btn" onClick={() => void runCheck()} disabled={checking || !man}>{checking ? 'Checking…' : 'Check saved copies'}</button>
        {check && (check.length === 0 ? <p role="status">Every saved file is readable.</p> : <ul className="dl-list" role="status">{check.map((c) => <li key={c}>{c}</li>)}</ul>)}
      </section>

      <section className="card">
        <h2 className="card-title">Get ready to go offline</h2>
        <p className="small"><Link to="/downloads/plan">Plan it for a trip, retreat or class</Link>, choosing what to save and seeing the size first.</p>
        <p className="small">Saves your Bible and all the study data below: {man ? fmtBytes(dataBytes) : '…'} of study data plus your Bible (about 5 MB).</p>
        {metered && <p className="small" role="note">You look to be on mobile data. Wi-Fi is better for this.</p>}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={!man || !!all || !online} onClick={everything}>{all ? `Working… ${all}` : 'Download everything'}</button>
          {all && <button className="btn" onClick={() => abort.current?.abort()}>Stop</button>}
        </div>
        {!online && <p className="small" role="status">You are offline now. Connect to download.</p>}
        {msg && <p className="small" role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2 className="card-title">Bibles</h2>
        <ul className="dl-list">
          {shown.map((e) => { const size = sum(man?.editions?.[e.id]?.sizes); return (
            <li key={e.id}><span><strong>{e.name}</strong> <span className="muted small">{size ? fmtBytes(size) : ''}{ed[e.id] && savedOn(`e:${e.id}`) ? ` · saved ${savedOn(`e:${e.id}`)}` : ''}</span></span>
              <span className="dl-act">{prog[e.id] ? <span className="chip">{prog[e.id]}</span> : ed[e.id] ? <><span className="chip good">on this device</span> <button className="btn small ghost" onClick={() => dropEdition(e.id)}>Remove</button></> : <button className="btn small" disabled={!e.offlineAllowed || !online} onClick={() => getEdition(e.id)}>{e.offlineAllowed ? 'Download' : 'Not allowed'}</button>}</span>
              {err[e.id] && <span className="small dl-err" role="alert">{err[e.id]}</span>}</li>); })}
        </ul>
      </section>

      <section className="card">
        <h2 className="card-title">Study data</h2>
        <p className="muted small">Commentary, the Fathers, the Catechism, lessons, saints, maps and word studies. Text only.</p>
        <ul className="dl-list">
          {(man?.packs ?? []).map((p) => (
            <li key={p.id}><span>{p.label} <span className="muted small">{fmtBytes(p.bytes)}{pk[p.id] && savedOn(p.id) ? ` · saved ${savedOn(p.id)}` : ''}</span>{!pk[p.id] && pkc[p.id] && pkc[p.id].have > 0 && <span className="small dl-err" role="status"> Partly saved: {pkc[p.id].have} of {pkc[p.id].total} files. {pkc[p.id].total - pkc[p.id].have} missing, so it will not all work offline.</span>}</span>
              <span className="dl-act">{prog[p.id] ? <><span className="chip">{prog[p.id]}</span> <button className="btn small" onClick={() => abort.current?.abort()}>Stop</button></> : pk[p.id] ? <><span className="chip good">on this device</span> <button className="btn small ghost" onClick={() => dropPack(p)}>Remove</button></> : <button className="btn small" disabled={!online} onClick={() => getPack(p)}>{pkc[p.id]?.have ? 'Finish download' : 'Download'}</button>}</span>
              {err[p.id] && <span className="small dl-err" role="alert">{err[p.id]}</span>}</li>
          ))}
          {!man && <li className="muted">Loading…</li>}
        </ul>
      </section>

      <section className="card">
        <h2 className="card-title">Audio</h2>
        <p className="small">An episode is about 1 MB a minute: a Bible in a Year day is roughly {fmtBytes(estimateBytes(1560))}. Save episodes from the Bible in a Year, podcast and audiobook lists with the ⬇ button, or the next few days here.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" disabled={!!yearBusy || !online} onClick={() => saveYear(3)}>Save the next 3 days</button>
          <button className="btn" disabled={!!yearBusy || !online} onClick={() => saveYear(7)}>Save the next 7 days (~{fmtBytes(estimateBytes(1560) * 7)})</button>
        </div>
        {yearBusy && <p className="small" role="status">{yearBusy}</p>}
        <h3 style={{ marginBottom: 4 }}>Saved episodes ({saved.length})</h3>
        <ul className="dl-list">
          {saved.map((x) => <li key={x.id}><span>{x.title} <span className="muted small">{fmtBytes(x.bytes)}</span></span><span className="dl-act"><button className="btn small ghost" onClick={() => removeAudio(x.id, x.audio)}>Remove</button></span></li>)}
          {!saved.length && <li className="muted small">Nothing saved yet.</li>}
        </ul>
        {saved.length > 1 && <button className="btn small" onClick={() => { if (confirm(`Remove all ${saved.length} saved episodes (${fmtBytes(audioBytes)})?`)) void removeAllAudio(); }}>Remove all audio</button>}
        <p className="muted small">Some publishers do not allow saving. Those episodes stream as usual. Videos and the audio of other podcasts that block saving cannot be kept offline.</p>
      </section>

      <details className="card">
        <summary><strong>What works without a connection?</strong></summary>
        <ul className="list small">
          <li><strong>Always:</strong> your notes, highlights and journal; the Bibles you have opened or saved; prayers, the rosary, devotions, novenas and the prayer book; the Divine Office; the lessons you have opened.</li>
          <li><strong>After “Download everything”:</strong> every study tool, the full Catechism and library, and all the lessons.</li>
          <li><strong>After saving an episode:</strong> that episode.</li>
          <li><strong>Only online:</strong> videos; podcasts you have not saved; the daily readings of other countries; map pictures; sync and Drive backup.</li>
        </ul>
      </details>
    </div>
  );
}
