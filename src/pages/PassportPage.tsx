import { lazy, Suspense, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassport, usePassport, type Stamp } from '../lib/passport';
import { CATEGORIES, CATEGORY_OF, KIND_ICON, councilPins, type Category, type Kind } from '../lib/passportMap';
import { loadCatalog, type Item } from '../lib/passportCatalog';

const PassportMap = lazy(() => import('../components/PassportMap'));

const INK: Record<Category, string> = { saints: '#b0414f', councils: '#7a5aa8', library: '#b07a2a', arguments: '#4d6fb3', lives: '#2f8f6b', feasts: '#b3478a', games: '#3a8f9a', places: '#8a7a3a' };
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const inked = (t: number) => { const d = new Date(t); return `${MON[d.getMonth()]} ${d.getFullYear()}`; };
const spoken = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const tilt = (key: string) => { let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0; return ((Math.abs(h) % 9) - 4) * 0.9; };

/** One round ink stamp: the item's initial or emoji in the middle, the category round the top, the month and year inked round the bottom. */
function Roundel({ cat, glyph, top, bottom, empty, tiltKey }: { cat: Category; glyph: string; top: string; bottom: string; empty?: boolean; tiltKey: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`pp-stamp${empty ? ' pp-empty' : ''}`} viewBox="0 0 100 100" width="96" height="96" aria-hidden="true" focusable="false"
      style={{ color: INK[cat], transform: empty ? undefined : `rotate(${tilt(tiltKey)}deg)` }}>
      <defs>
        <path id={`t${id}`} d="M 17 50 A 33 33 0 0 1 83 50" />
        <path id={`b${id}`} d="M 14 50 A 36 36 0 0 0 86 50" />
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={empty ? '4 4' : undefined} />
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray={empty ? '2 3' : '1.5 2'} />
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text className="pp-arc" fill="currentColor"><textPath href={`#t${id}`} startOffset="50%" textAnchor="middle">{top}</textPath></text>
      <text className="pp-arc" fill="currentColor"><textPath href={`#b${id}`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{bottom}</textPath></text>
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className={glyph.length > 1 && /\p{Extended_Pictographic}/u.test(glyph) ? 'pp-emoji' : 'pp-initial'} fill="currentColor">{glyph}</text>
    </svg>
  );
}

const glyphOf = (kind: Kind, label: string) => {
  const t = label.replace(/^(Saints? of|Readings,|Feast card,|The|St\.?|Saint)\s+/i, '').trim();
  const c = Array.from(t)[0];
  return c && /[\p{L}\p{N}]/u.test(c) ? c.toUpperCase() : KIND_ICON[kind];
};
const CAT_TOP: Record<Category, string> = { saints: 'SAINTS', councils: 'COUNCIL', library: 'LIBRARY', arguments: 'ARGUMENT', lives: 'PILGRIM', feasts: 'FEAST', games: 'GAME', places: 'PLACE' };

interface Slot { key: string; kind: Kind; label: string; to?: string; stamp?: Stamp }

export default function PassportPage() {
  const stamps = usePassport();
  const [catalog, setCatalog] = useState<Item[] | null>(null);
  const [empties, setEmpties] = useState(true);
  const [sure, setSure] = useState(false);
  useEffect(() => { let on = true; loadCatalog().then((c) => on && setCatalog(c)).catch(() => on && setCatalog([])); return () => { on = false; }; }, []);

  const held = useMemo(() => new Map(stamps.map((s) => [`${s.k}:${s.i}`, s])), [stamps]);
  const slots = useMemo(() => {
    const by = new Map<Category, Slot[]>(CATEGORIES.map((c) => [c.id, []]));
    const seen = new Set<string>();
    for (const it of catalog ?? []) {
      const key = `${it.kind}:${it.id}`;
      seen.add(key);
      by.get(CATEGORY_OF[it.kind])!.push({ key, kind: it.kind, label: it.label, to: it.to, stamp: held.get(key) });
    }
    const extra = new Map<Category, Slot[]>(CATEGORIES.map((c) => [c.id, []]));
    for (const s of stamps) { const key = `${s.k}:${s.i}`; if (!seen.has(key)) extra.get(CATEGORY_OF[s.k])!.push({ key, kind: s.k, label: s.l, stamp: s }); }
    return { by, extra };
  }, [catalog, held, stamps]);

  const pins = useMemo(() => {
    const got = new Set(stamps.filter((s) => s.k === 'council').map((s) => s.i));
    return councilPins(got).map((p) => ({ place: p.place, lat: p.lat, lon: p.lon, held: p.got.length > 0, text: p.got.length ? `${p.got.length} of ${p.councils.length} councils stamped` : `${p.councils.length} council${p.councils.length > 1 ? 's' : ''} to find` }));
  }, [stamps]);

  const next = useMemo(() => {
    const todo = (catalog ?? []).filter((it) => !held.has(`${it.kind}:${it.id}`));
    const order: Kind[] = ['hub', 'council', 'game', 'life', 'argument', 'heresy', 'mentor', 'walk', 'word', 'claim', 'development', 'feast'];
    const picks: Item[] = [];
    for (let round = 0; round < 2 && picks.length < 8; round++) for (const k of order) { const f = todo.filter((t) => t.kind === k)[round]; if (f && picks.length < 8) picks.push(f); }
    return picks;
  }, [catalog, held]);

  const first = stamps.length ? stamps[stamps.length - 1] : null;
  const placeText = pins.filter((p) => p.held).map((p) => p.place).join(', ');

  return (
    <div className="page pp-page">
      <h1>Pilgrim’s Passport</h1>
      <p className="lede">A stamp for each place you have been in the app: a saint, a council, a feast, an argument, a life, a game. They are made by themselves the first time you open something.</p>
      <p className="pp-private" role="note"><strong>Private.</strong> Your stamps are kept only on this device. They are never sent anywhere, there is no account, and nothing is counted or compared. They go with you only if you save a backup file or use “Move my place” under <Link to="/profile">You</Link>.</p>

      <div className="pp-summary" aria-live="polite">
        <strong className="pp-big">{stamps.length}</strong> <span>{stamps.length === 1 ? 'stamp' : 'stamps'}{first ? ` since ${spoken(first.t)}` : ''}</span>
      </div>
      {stamps.length === 0 && <p className="muted">Your book is empty. Open a saint, a council or a game and come back: the first stamp will be waiting.</p>}

      <section aria-labelledby="pp-map-h">
        <h2 id="pp-map-h">Map of the Church</h2>
        <Suspense fallback={<div className="pp-map" aria-hidden="true" />}>
          <PassportMap pins={pins} label={`Map of the Mediterranean world. ${placeText ? `You hold council stamps for ${placeText}.` : 'No council stamps yet.'}`} />
        </Suspense>
        <p className="muted small">Filled pins are places where you hold a council stamp; rings are places still to find. {placeText ? `Stamped: ${placeText}.` : 'Open a council to place your first pin.'}</p>
      </section>

      {next.length > 0 && (
        <section aria-labelledby="pp-next-h">
          <h2 id="pp-next-h">Next stamps to find</h2>
          <ul className="pp-next">
            {next.map((it) => <li key={`${it.kind}:${it.id}`}><Link to={it.to}><span aria-hidden="true">{KIND_ICON[it.kind]}</span> {it.label}</Link> <span className="muted small">· {CATEGORIES.find((c) => c.id === CATEGORY_OF[it.kind])!.title}</span></li>)}
          </ul>
        </section>
      )}

      <label className="row pp-toggle"><input type="checkbox" checked={empties} onChange={(e) => setEmpties(e.target.checked)} /> <span>Show the spaces still to fill</span></label>

      {CATEGORIES.map((c) => {
        const cat = slots.by.get(c.id)!, extra = slots.extra.get(c.id)!;
        const total = cat.length, got = cat.filter((s) => s.stamp).length;
        const shown = [...cat.filter((s) => s.stamp), ...extra, ...(empties ? cat.filter((s) => !s.stamp) : [])];
        const count = total ? `${got} of ${total}${extra.length ? `, and ${extra.length} more` : ''}` : `${extra.length} ${extra.length === 1 ? 'stamp' : 'stamps'}`;
        return (
          <section key={c.id} aria-labelledby={`pp-${c.id}`} className="pp-cat">
            <h2 id={`pp-${c.id}`}><span aria-hidden="true">{c.icon}</span> {c.title} <span className="pp-count">{count}</span></h2>
            <p className="muted small">{c.blurb}</p>
            {shown.length === 0 && <p className="muted small">{catalog ? 'Nothing stamped here yet.' : 'Loading…'}</p>}
            <ul className="pp-grid">
              {shown.map((s) => {
                const body = (
                  <>
                    <Roundel cat={c.id} glyph={glyphOf(s.kind, s.label)} top={CAT_TOP[c.id]} bottom={s.stamp ? inked(s.stamp.t) : ''} empty={!s.stamp} tiltKey={s.key} />
                    <span className="pp-label">{s.label}</span>
                  </>
                );
                if (!s.stamp) return <li key={s.key} className="pp-slot" aria-hidden="true">{body}</li>;
                const to = s.to ?? undefined;
                return (
                  <li key={s.key}>
                    {to ? <Link to={to} className="pp-item" aria-label={`${s.label}, stamped ${spoken(s.stamp.t)}`}>{body}</Link> : <div className="pp-item" role="group" aria-label={`${s.label}, stamped ${spoken(s.stamp.t)}`}>{body}</div>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="pp-reset-h" className="pp-reset">
        <h2 id="pp-reset-h">Start a fresh book</h2>
        {!sure ? (
          <button className="btn" onClick={() => setSure(true)} disabled={!stamps.length}>Reset my passport</button>
        ) : (
          <div className="card" role="alertdialog" aria-labelledby="pp-sure-h" aria-describedby="pp-sure-d">
            <p id="pp-sure-h"><strong>Erase all {stamps.length} stamps?</strong></p>
            <p id="pp-sure-d" className="muted small">This clears the passport on this device only. Notes, highlights, plans and progress are not touched. It cannot be undone unless you have a backup.</p>
            <div className="btn-row">
              <button className="btn primary" autoFocus onClick={() => { resetPassport(); setSure(false); }}>Yes, erase my stamps</button>
              <button className="btn" onClick={() => setSure(false)}>Keep them</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
