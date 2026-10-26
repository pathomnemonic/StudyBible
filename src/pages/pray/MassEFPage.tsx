import { useEffect, useMemo, useState } from 'react';
import FinePrint from '../../components/FinePrint';
import { Link } from 'react-router-dom';
import { efDay, getOrdo, getPrefaces, prefaceKey, type EfResult } from '../../liturgy/missaEF';
import { addDays, iso, parseIso } from '../../liturgy/compute';
import { useWakeLock } from '../../lib/wakeLock';

const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const get = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
interface B { k: string; t?: string; who?: string; name?: string; if?: string }

const WHO: Record<string, string> = { P: 'Priest', S: 'Server', D: 'Deacon', M: 'Priest', V: 'Priest', R: 'Server', C: 'Choir', A: 'All' };

/** Render a block of proper text: lines starting with ! are references or rubrics, and "v." marks the start of a spoken text. */
function Text({ text }: { text: string }) {
  return <>{text.split(/\n+/).map((l, i) => {
    const s = l.trim();
    if (!s) return null;
    if (s.startsWith('!')) return <p key={i} className="muted small" style={{ fontStyle: 'italic', margin: '.2em 0' }}>{s.replace(/^!+\s*/, '')}</p>;
    return <p key={i} style={{ margin: '.35em 0' }}>{s.replace(/^[vV]\.\s+/, '')}</p>;
  })}</>;
}

/** The Mass of the Extraordinary Form (1962 books), a low Mass in English, with the propers of the day. */
export default function MassEFPage() {
  const [date, setDate] = useState(today());
  const [r, setR] = useState<EfResult | null | undefined>(undefined);
  const [ordo, setOrdo] = useState<B[]>([]);
  const [pref, setPref] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  const [size, setSize] = useState(() => +get('sb:mass:size', '22') || 22);
  const [awake, setAwake] = useState(() => get('sb:mass:awake', '1') === '1');
  useWakeLock(awake);
  useEffect(() => { getOrdo().then(setOrdo); getPrefaces().then(setPref); }, []);
  useEffect(() => { setR(undefined); efDay(date).then((x) => { setR(x); setI(0); }); }, [date]);

  // steps: one per heading of the Order of Mass
  const steps = useMemo(() => {
    const out: { title: string; blocks: B[] }[] = [];
    for (const b of ordo) {
      if (b.k === 'h') out.push({ title: b.t ?? '', blocks: [] });
      else if (out.length) out[out.length - 1].blocks.push(b);
    }
    return out;
  }, [ordo]);
  const flagOk = (b: B) => !b.if || (b.if === 'gloria' && !!r?.day.rule.gloria) || (b.if === 'credo' && !!r?.day.rule.credo) || (b.if === 'judica' && !r?.passiontide);
  const shown = steps.filter((s) => s.title !== 'Creed' || r?.day.rule.credo);
  const idx = Math.min(i, Math.max(0, shown.length - 1));
  const step = shown[idx];
  const sec = (name: string) => {
    const x = r?.day; if (!x) return null;
    const key = name[0].toUpperCase() + name.slice(1);
    const eng = x.p[key];
    const lat = x.lat?.[key];
    if (key === 'Graduale') return <>{x.p.Graduale && <Text text={x.p.Graduale} />}{x.p.Tractus && <Text text={x.p.Tractus} />}{!x.p.Graduale && !x.p.Tractus && x.lat?.Graduale && <Text text={x.lat.Graduale} />}</>;
    if (key === 'Prefatio') { const t = pref[prefaceKey(r!)]; return t ? <Text text={t} /> : <p className="muted">The Preface of the day is in your missal.</p>; }
    if (eng) return <Text text={eng} />;
    if (lat) return <><p className="muted small">Only the Latin text is in the source:</p><Text text={lat} /></>;
    return <p className="muted">This part is not in the source for this day. Use your missal.</p>;
  };
  const go = (n: number) => setI(Math.max(0, Math.min(shown.length - 1, n)));
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(idx + 1); } else if (e.key === 'ArrowLeft') go(idx - 1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [idx, shown.length]);

  return (
    <div className="page mass-mode" style={{ ['--mass-size' as string]: `${size}px` }}>
      <div className="row between no-print" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Link to="/pray" className="small">← Pray</Link>
        <div className="row" style={{ gap: 6 }}>
          <Link className="btn small" to="/mass">Ordinary Form</Link>
          <button className="btn small" onClick={() => { const n = Math.max(16, size - 2); setSize(n); put('sb:mass:size', String(n)); }} aria-label="A−, smaller text">A−</button>
          <button className="btn small" onClick={() => { const n = Math.min(40, size + 2); setSize(n); put('sb:mass:size', String(n)); }} aria-label="A+, larger text">A+</button>
          <button className="btn small" onClick={() => { setAwake(!awake); put('sb:mass:awake', awake ? '0' : '1'); }} aria-pressed={awake}>Screen on</button>
        </div>
      </div>
      <div className="row between no-print" style={{ gap: 6, margin: '6px 0' }}>
        <button className="btn small" onClick={() => setDate(iso(addDays(parseIso(date), -1)))} aria-label="Previous day">‹</button>
        <span className="small">{parseIso(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
        <span className="row" style={{ gap: 4 }}><button className="btn small" onClick={() => setDate(today())}>Today</button><button className="btn small" onClick={() => setDate(iso(addDays(parseIso(date), 1)))} aria-label="Next day">›</button></span>
      </div>
      {r === undefined && <p className="muted">Loading…</p>}
      {r === null && <p className="card">No Mass is on file for this date.</p>}
      {r && (
        <>
          <p style={{ margin: '4px 0' }}><strong>{r.day.name}</strong> <span className="muted small">{r.day.cls}{!r.day.rule.gloria ? ' · no Gloria' : ''}{!r.day.rule.credo ? ' · no Credo' : ''}</span></p>
          {r.notes.map((n) => <p key={n} className="muted small" style={{ margin: '2px 0' }}>{n}</p>)}
          {step && (
            <>
              <div className="mass-bar" role="progressbar" aria-valuemin={1} aria-valuemax={shown.length} aria-valuenow={idx + 1} aria-label="Progress through the Mass"><i style={{ width: `${((idx + 1) / shown.length) * 100}%` }} /></div>
              <article className="mass-card" aria-live="polite">
                <h1 className="mass-title">{step.title}</h1>
                {step.blocks.filter(flagOk).map((b, k) => {
                  if (b.k === 'p') return <div key={k} className="ef-proper">{sec(b.name!)}</div>;
                  if (b.k === 'r') return <p key={k} className="muted small" style={{ fontStyle: 'italic', margin: '.5em 0 .2em' }}>{b.t}</p>;
                  if (b.k === 'd') return <p key={k} style={{ margin: '.25em 0' }}><span className="office-k">{WHO[b.who!] ?? b.who}.</span> {b.t}</p>;
                  if (b.k === 'em') return <p key={k} className="mass-verse" style={{ fontWeight: 700, textAlign: 'center' }}>{b.t}</p>;
                  if (b.k === 'h2') return <h2 key={k} className="eyebrow-h">{b.t}</h2>;
                  return <p key={k} style={{ margin: '.35em 0' }}>{b.t}</p>;
                })}
              </article>
              <div className="mass-nav no-print">
                <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>← Back</button>
                <span className="muted">{idx + 1} / {shown.length}</span>
                <button className="btn primary" onClick={() => go(idx + 1)} disabled={idx === shown.length - 1}>Next →</button>
              </div>
            </>
          )}
        </>
      )}
      <FinePrint>The Mass of the 1962 books in English from the Divinum Officium project (MIT license), as a low Mass. The Mass of the day is chosen by the rank of the season and the saint; commemorations and some transferred feasts are not applied, so check your own missal or parish calendar. Where the source lacks a text, the page says so. The Latin text is not included.</FinePrint>
    </div>
  );
}
