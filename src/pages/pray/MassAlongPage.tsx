import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OF_STEPS, POSTURE, type Slot } from '../../liturgy/massSteps';
import { liturgicalDay, parseIso, COLOR_NAME } from '../../liturgy/compute';
import { readingsFor, type DayReadings } from '../../liturgy/readings';
import { cccPara } from '../../data/ccc';
import { THEMES, useSettings } from '../../lib/store';
import { useWakeLock } from '../../lib/wakeLock';
import ReadingBlock from '../../components/ReadingBlock';
import FinePrint from '../../components/FinePrint';
import { BOOK_PRAYERS } from '../../data/prayerbook';

const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const get = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/** Which Catechism paragraph says what is happening at each part (CCC 1136-1144 and 1345-1355). Parts with no fitting paragraph have none. */
const CCC_FOR: Record<string, number> = {
  entrance: 1348, greeting: 1140, first: 1349, psalm: 1349, second: 1349, alleluia: 1349, gospel: 1349, homily: 1349, faithful: 1349,
  gifts: 1350, orate: 1350, preface: 1352, sanctus: 1352, consecration: 1353, amen: 1354, ourfather: 1355, peace: 1355, agnus: 1355, communion: 1355,
};
const INTRO_CCC = 1346;

/** The first sentences of a paragraph (at most ~320 characters), copied unchanged. */
function lead(t: string) {
  const flat = t.replace(/\s+/g, ' ').trim();
  const ends = [...flat.matchAll(/[.!?]["”')]?(?=\s|$)/g)].map((m) => m.index! + m[0].length);
  let cut = 0;
  for (const e of ends) { if (e <= 320) cut = e; else break; }
  return cut ? flat.slice(0, cut) : flat.slice(0, 320).replace(/\s+\S*$/, '') + '…';
}

const isDark = (theme: string) => {
  const row = THEMES.find((t) => t[0] === theme);
  if (!row) return false;
  const h = row[2].replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

/** Read the Mass along: one quiet, large block at a time. The Order of Mass already in the app, today’s readings and, if you wish, a line from the Catechism on each part. */
export default function MassAlongPage() {
  const [st, set] = useSettings();
  const date = today();
  const d = parseIso(date);
  const lit = liturgicalDay(d, st.diocese === 'US' ? 'usa' : 'universal');
  const big = lit.rank === 'solemnity' || lit.rank === 'sunday' || lit.rank === 'triduum' || d.getUTCDay() === 0;
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [gloria, setGloria] = useState(() => big && lit.season !== 'advent' && lit.season !== 'lent');
  const [creed, setCreed] = useState(big);
  const [second, setSecond] = useState(big);
  const [explain, setExplain] = useState(() => get('sb:massalong:explain', '1') === '1');
  const [i, setI] = useState(() => Math.max(0, +get(`sb:massalong:${date}`, '0') || 0));
  const [list, setList] = useState(false);
  const [lines, setLines] = useState<Record<number, string>>({});
  useWakeLock(st.keepAwake);
  useEffect(() => { readingsFor(st.diocese, date).then(setRd); }, [date, st.diocese]);
  const steps = useMemo(() => OF_STEPS.filter((s) => (s.only === 'gloria' ? gloria : s.only === 'creed' ? creed : s.only === 'second' ? second : true)), [gloria, creed, second]);
  // block 0 is the opening block; blocks 1..n are the parts of the Mass
  const total = steps.length + 1;
  const idx = Math.min(i, total - 1);
  const step = idx === 0 ? null : steps[idx - 1];
  useEffect(() => put(`sb:massalong:${date}`, String(idx)), [idx, date]);
  const go = (n: number) => { setI(Math.max(0, Math.min(total - 1, n))); window.scrollTo?.({ top: 0 }); };
  const want = step ? CCC_FOR[step.id] : INTRO_CCC;
  useEffect(() => {
    if (!explain || !want || lines[want]) return;
    cccPara(want).then((p) => p && setLines((x) => ({ ...x, [want]: lead(p.t) })));
  }, [explain, want]);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input,select,textarea,summary')) return;
      if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [idx, total]);

  const size = Math.max(st.fontSize, 22);
  const dark = isDark(st.theme);
  const item = (slot: Slot) => rd?.items.find((x) => x.slot === slot);
  const creedText = BOOK_PRAYERS.find((p) => p.id === 'nicene')?.text;
  const pater = BOOK_PRAYERS.find((p) => p.id === 'pater')?.text;
  const what = explain && want && lines[want] ? (
    <p className="ma-what"><strong>What is happening here?</strong> {lines[want]} <Link className="small" to={`/study/catechism/${want}`}>CCC {want}</Link></p>
  ) : null;
  const sections = [...new Set(steps.map((s) => s.part))];

  return (
    <div className="page ma-page" style={{ ['--ma-size' as string]: `${size}px` }}>
      <div className="row between ma-bar no-print">
        <span />
        <div className="row ma-controls">
          <button className="btn small" onClick={() => set({ fontSize: Math.max(18, st.fontSize - 2) })} aria-label="Smaller text">A−</button>
          <button className="btn small" onClick={() => set({ fontSize: Math.min(44, st.fontSize + 2) })} aria-label="Larger text">A+</button>
          <button className="btn small" onClick={() => set({ theme: dark ? 'light' : 'dark' })} aria-pressed={dark}>{dark ? 'Light' : 'Dark'}</button>
          <button className="btn small" onClick={() => setList(!list)} aria-expanded={list}>Settings</button>
        </div>
      </div>
      <div className="mass-bar" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={idx + 1} aria-label="Progress through the Mass"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>

      {list && (
        <div className="card no-print ma-settings">
          <label className="small"><input type="checkbox" checked={st.keepAwake} onChange={(e) => set({ keepAwake: e.target.checked })} /> Keep the screen on</label>
          <label className="small"><input type="checkbox" checked={explain} onChange={(e) => { setExplain(e.target.checked); put('sb:massalong:explain', e.target.checked ? '1' : '0'); }} /> Show “What is happening here?”</label>
          <label className="small"><input type="checkbox" checked={gloria} onChange={(e) => setGloria(e.target.checked)} /> Gloria</label>
          <label className="small"><input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} /> Second reading</label>
          <label className="small"><input type="checkbox" checked={creed} onChange={(e) => setCreed(e.target.checked)} /> Creed</label>
          {sections.map((p) => (
            <div key={p}><strong className="small">{p}</strong>
              <div className="chips">{steps.map((s, k) => s.part === p && <button key={s.id} className={`chip${k + 1 === idx ? ' sel' : ''}`} onClick={() => { go(k + 1); setList(false); }}>{s.title}</button>)}</div>
            </div>
          ))}
          <p className="muted small">Text size, theme and the screen setting are your reading settings, shared with the rest of the app.</p>
        </div>
      )}

      <article className="ma-card" aria-live="polite" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 70) go(idx + (dx < 0 ? 1 : -1)); }}>
        {!step ? (
          <>
            <p className="ma-part">Today</p>
            <h1 className="ma-title">{lit.dayName}</h1>
            <p className="muted">{COLOR_NAME[lit.color]} · Mass (Ordinary Form)</p>
            <p>Take your time. Use Next and Back, or swipe. The readings are today’s own.</p>
            {what}
            <p className="small"><Link to="/mass">The full Mass mode, with postures</Link> · <Link to="/pray/readings-together">Why these readings together</Link></p>
          </>
        ) : (
          <>
            <p className="ma-part">{step.part}</p>
            <h1 className="ma-title">{step.title}</h1>
            <p className="ma-posture"><span aria-hidden="true">{POSTURE[step.posture].icon}</span> <strong>{POSTURE[step.posture].label}</strong></p>
            {step.fill ? (() => {
              const it = item(step.fill);
              if (!it) return <p className="muted">Today’s {step.title.toLowerCase()} is not available offline. Open <Link to={`/pray/readings/${date}`}>the readings page</Link>.</p>;
              if (step.fill === 'gospel_acclamation') return <p className="ma-verse">{it.text}</p>;
              return <ReadingBlock refs={it.refs} label={step.title} text={it.text} max={80} />;
            })() : <p className="ma-body">{step.what}</p>}
            {step.people && step.people.length > 0 && <div className="ma-people"><strong>You:</strong><ul>{step.people.map((p) => <li key={p}>{p}</li>)}</ul></div>}
            {step.id === 'creed' && creedText && <details open><summary>The Nicene Creed (traditional wording)</summary><p style={{ whiteSpace: 'pre-line' }}>{creedText}</p></details>}
            {step.id === 'ourfather' && pater && <details open><summary>The Our Father</summary><p style={{ whiteSpace: 'pre-line' }}>{pater}</p></details>}
            {what}
          </>
        )}
      </article>

      <div className="mass-nav no-print">
        <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>← Back</button>
        <span className="muted">{idx + 1} / {total}</span>
        <button className="btn primary" onClick={() => go(idx + 1)} disabled={idx === total - 1}>Next →</button>
      </div>
      <FinePrint>The long prayers of the Roman Missal are copyrighted and are not printed here: follow the words in your missalette. Today’s readings are printed in your chosen translation. The “What is happening here?” lines are copied from the Catechism of the Catholic Church. Posture follows the usual United States practice; follow your parish.</FinePrint>
    </div>
  );
}
