import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { downloadEdition, downloadPack, getManifest, isEditionCached, packStillCached, type StudyPack } from '../data/loader';
import { BOOKS } from '../lib/canon';
import { useSettings } from '../lib/store';
import { fmtBytes } from '../lib/offlineAudio';

type Man = { packs: StudyPack[]; editions?: Record<string, { sizes: Record<string, number> }> };
const sum = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);

const PRESETS: { id: string; title: string; blurb: string; packs: string[] }[] = [
  { id: 'trip', title: 'A trip or pilgrimage', blurb: 'Your Bible, prayers, the Mass and Office, maps and the saints.', packs: ['prayer', 'places', 'people', 'reference'] },
  { id: 'flight', title: 'A long flight', blurb: 'Your Bible and the things to read and pray with, in a small download.', packs: ['prayer', 'reference', 'links'] },
  { id: 'retreat', title: 'A retreat', blurb: 'The Bible, prayer, the Catechism and the Fathers and saints to read.', packs: ['prayer', 'learn', 'library', 'people', 'reference'] },
  { id: 'class', title: 'A classroom or home school', blurb: 'The lessons, Catechism, prayers and reference pages.', packs: ['learn', 'prayer', 'reference', 'links'] },
  { id: 'all', title: 'Everything', blurb: 'All the Bibles you use and every study pack.', packs: ['*'] },
];

/** Plan what to save for a trip, a retreat or a class: pick a purpose or tick items, see the total size and the time it will take, and download it in one go. */
export default function OfflinePlanPage() {
  const { editions } = useEditions();
  const [s] = useSettings();
  const [man, setMan] = useState<Man | null>(null);
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState('');
  const abort = useRef<AbortController | null>(null);
  const conn = (navigator as unknown as { connection?: { type?: string; saveData?: boolean; downlink?: number } }).connection;
  const metered = conn?.type === 'cellular' || conn?.saveData === true;
  const online = typeof navigator === 'undefined' || navigator.onLine;
  const bibles = editions.filter((e) => e.offlineAllowed && (!e.offByDefault || e.id === s.defaultEdition));

  useEffect(() => {
    getManifest().then((m) => { setMan(m as Man); (m?.packs ?? []).forEach((p) => packStillCached(p).then((ok) => setHave((x) => ({ ...x, [`p:${p.id}`]: ok })))); }).catch(() => {});
    editions.forEach((e) => isEditionCached(e.id, BOOKS.map((b) => b.id)).then((c) => setHave((x) => ({ ...x, [`e:${e.id}`]: c }))));
  }, [editions]);
  useEffect(() => { if (s.defaultEdition) setPick((p) => (p.size ? p : new Set([`e:${s.defaultEdition}`]))); }, [s.defaultEdition]);

  const sizeOf = (key: string) => (key.startsWith('e:') ? sum(man?.editions?.[key.slice(2)]?.sizes) : man?.packs.find((p) => `p:${p.id}` === key)?.bytes ?? 0);
  const todo = [...pick].filter((k) => !have[k]);
  const total = todo.reduce((n, k) => n + sizeOf(k), 0);
  const mbps = conn?.downlink && conn.downlink > 0 ? conn.downlink / 8 : 2.5;
  const minutes = Math.max(1, Math.round(total / 1e6 / mbps / 60));
  const toggle = (k: string) => setPick((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const preset = (packs: string[]) => setPick(new Set([...(s.defaultEdition ? [`e:${s.defaultEdition}`] : []), ...(packs[0] === '*' ? [...(man?.packs ?? []).map((p) => `p:${p.id}`), ...bibles.map((b) => `e:${b.id}`)] : packs.map((x) => `p:${x}`))]));

  const run = async () => {
    if (!man) return;
    setMsg(''); abort.current = new AbortController();
    const list = todo.slice().sort((a, b) => sizeOf(a) - sizeOf(b));
    try {
      for (let i = 0; i < list.length; i++) {
        const k = list[i]; setProgress(`${i + 1} of ${list.length}`);
        if (k.startsWith('e:')) { await downloadEdition(k.slice(2), BOOKS.map((b) => b.id), () => {}, abort.current.signal); setHave((x) => ({ ...x, [k]: true })); }
        else { const p = man.packs.find((x) => `p:${x.id}` === k)!; const r = await downloadPack(p, () => {}, abort.current.signal); if (r.storageFull) throw new Error('This device is out of room for this site. Free some space and try again.'); setHave((x) => ({ ...x, [k]: !r.failed.length && !r.cancelled })); }
        if (abort.current.signal.aborted) break;
      }
      setMsg(abort.current.signal.aborted ? 'Stopped. Start again to carry on where it left off.' : 'Done. Everything you chose is on this device and works without a connection.');
    } catch (e) { setMsg((e as Error).message); }
    setProgress('');
  };

  return (
    <div className="page offplan">
      <h1>Get ready to go offline</h1>
      <p className="lede">Choose what the trip or class needs. You will see the size before anything downloads.</p>
      <div className="chips" role="group" aria-label="Purpose">{PRESETS.map((x) => <button key={x.id} className="chip" title={x.blurb} onClick={() => preset(x.packs)}>{x.title}</button>)}</div>
      <section className="card">
        <h2 className="card-title">Bibles</h2>
        <ul className="dl-list">{bibles.map((e) => { const k = `e:${e.id}`; return <li key={k}><label className="row" style={{ gap: 8 }}><input type="checkbox" checked={pick.has(k)} disabled={!!have[k]} onChange={() => toggle(k)} /><span>{e.name} <span className="muted small">{fmtBytes(sizeOf(k))}{have[k] ? ' · on this device' : ''}</span></span></label></li>; })}</ul>
      </section>
      <section className="card">
        <h2 className="card-title">Study data</h2>
        <ul className="dl-list">{(man?.packs ?? []).map((p) => { const k = `p:${p.id}`; return <li key={k}><label className="row" style={{ gap: 8 }}><input type="checkbox" checked={pick.has(k)} disabled={!!have[k]} onChange={() => toggle(k)} /><span>{p.label} <span className="muted small">{fmtBytes(p.bytes)}{have[k] ? ' · on this device' : ''}</span></span></label></li>; })}{!man && <li className="muted">Loading…</li>}</ul>
      </section>
      <section className="card">
        <p><strong>{todo.length ? `${fmtBytes(total)} to download` : 'Nothing new to download'}</strong>{todo.length ? <span className="muted"> · about {minutes} minute{minutes === 1 ? '' : 's'} on Wi-Fi</span> : null}</p>
        {metered && <p className="small" role="note">You look to be on mobile data. Wi-Fi is better for this.</p>}
        {!online && <p className="small" role="status">You are offline now. Connect to download.</p>}
        <div className="row" style={{ gap: 8 }}><button className="btn primary" disabled={!todo.length || !!progress || !online} onClick={() => void run()}>{progress ? `Working… ${progress}` : 'Download these'}</button>{progress && <button className="btn" onClick={() => abort.current?.abort()}>Stop</button>}</div>
        {msg && <p className="small" role="status">{msg}</p>}
      </section>
      <p className="small"><Link to="/downloads">All downloads, audio and free-up-space</Link></p>
    </div>
  );
}
