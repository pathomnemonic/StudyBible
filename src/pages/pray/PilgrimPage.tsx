import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PILGRIM_SITES as BASE_SITES, CHECKLIST } from '../../data/pilgrim';
import { MORE_SITES } from '../../data/pilgrim2';

const PILGRIM_SITES = [...BASE_SITES, ...MORE_SITES];
import { Tip } from '../../components/Hints';

const KEY = 'sb:pilgrim';
const load = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };

/** A pilgrim's pack: guides that work with no signal, a getting-ready checklist, and a prayer for the way. */
export default function PilgrimPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const site = PILGRIM_SITES.find((s) => s.id === id);
  const [done, setDone] = useState<string[]>(load);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const toggle = (k: string) => { const n = done.includes(k) ? done.filter((x) => x !== k) : [...done, k]; setDone(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } };
  return (
    <div className="page pilgrim">
      <h1>Pilgrim pack</h1>
      <Tip id="pilgrim" title="Made for the road">Everything on this page is stored in the app, so it works with no signal. Tick the checklist before you go.</Tip>
      <p className="lede">Guides to the great Catholic pilgrimage places. {online ? 'You are online.' : 'You are offline, and everything here still works.'}</p>
      {!site && <>
        <ul className="pil-grid">
          {PILGRIM_SITES.map((s) => (
            <li key={s.id}><Link to={`/pray/pilgrim/${s.id}`}><strong>{s.name}</strong><span className="muted small">{s.place}</span><span className="small">{s.tag}</span></Link></li>
          ))}
        </ul>
        <h2>Before you go</h2>
        <ul className="pil-check">{CHECKLIST.map(([k, t]) => <li key={k}><label><input type="checkbox" checked={done.includes(k)} onChange={() => toggle(k)} /> <span>{t}</span></label></li>)}</ul>
        <p className="small"><Link to="/settings">Download Bibles and study data in Settings</Link> · <Link to="/pray/journal">Open your journal</Link> · <Link to="/pray/devotions/rosary">Pray the rosary</Link></p>
      </>}
      {site && <>
        <p><button className="btn small" onClick={() => nav('/pray/pilgrim')}>← All places</button></p>
        <h2>{site.name} <span className="muted small">· {site.place}</span></h2>
        <p>{site.story}</p>
        <h3>Where to pray</h3>
        <ul>{site.stops.map((s) => <li key={s.name}><strong>{s.name}.</strong> {s.note}</li>)}</ul>
        <h3>Read on the way</h3>
        <ul>{site.scripture.map((s) => <li key={s.ref}><Link to={`/study/search?q=${encodeURIComponent(s.ref)}`}>{s.ref}</Link>: {s.why}</li>)}</ul>
        <h3>{site.prayer.title}</h3>
        <blockquote className="pil-prayer">{site.prayer.text}</blockquote>
        <h3>Useful words ({site.lang})</h3>
        <dl className="pil-phrases">{site.phrases.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        <h3>Saints to ask for</h3>
        <p>{site.saints.join(' · ')}</p>
        <p className="muted small">Opening times, Mass times and booking change. Check the official site before you travel: <a href={site.site} target="_blank" rel="noreferrer noopener">{site.site.replace('https://', '')}</a></p>
      </>}
    </div>
  );
}
