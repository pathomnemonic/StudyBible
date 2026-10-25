import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OF_STEPS, POSTURE, type MassStep, type Slot } from '../../liturgy/massSteps';
import { liturgicalDay, parseIso, COLOR_NAME } from '../../liturgy/compute';
import { readingsFor, type DayReadings } from '../../liturgy/readings';
import { useSettings } from '../../lib/store';
import { traditionOf } from '../../lib/tradition';
import { useWakeLock } from '../../lib/wakeLock';
import ReadingBlock from '../../components/ReadingBlock';
import { BOOK_PRAYERS } from '../../data/prayerbook';

const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const get = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/** Mass mode: one large card at a time with the posture, what is happening, what the people say and today’s readings. */
export default function MassModePage() {
  const [st] = useSettings();
  const t = traditionOf(st.tradition);
  const date = today();
  const d = parseIso(date);
  const lit = liturgicalDay(d, st.diocese === 'US' ? 'usa' : 'universal');
  const sunday = d.getUTCDay() === 0;
  const big = lit.rank === 'solemnity' || lit.rank === 'sunday' || lit.rank === 'triduum' || sunday;
  const [rd, setRd] = useState<DayReadings | null>(null);
  const [i, setI] = useState(() => Math.max(0, Math.min(OF_STEPS.length - 1, +get(`sb:mass:${date}`, '0'))));
  const [size, setSize] = useState(() => +get('sb:mass:size', '22') || 22);
  const [awake, setAwake] = useState(() => get('sb:mass:awake', '1') === '1');
  const [list, setList] = useState(false);
  const [gloria, setGloria] = useState(() => big && lit.season !== 'advent' && lit.season !== 'lent');
  const [creed, setCreed] = useState(big);
  const [second, setSecond] = useState(big);
  const [force, setForce] = useState(false);
  useWakeLock(awake);
  useEffect(() => { readingsFor(st.diocese, date).then(setRd); }, [date, st.diocese]);
  const steps = useMemo(() => OF_STEPS.filter((s) => (s.only === 'gloria' ? gloria : s.only === 'creed' ? creed : s.only === 'second' ? second : true)), [gloria, creed, second]);
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  useEffect(() => put(`sb:mass:${date}`, String(idx)), [idx, date]);
  const go = (n: number) => setI(Math.max(0, Math.min(steps.length - 1, n)));
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(idx + 1); } else if (e.key === 'ArrowLeft') go(idx - 1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [idx, steps.length]);

  if (!t.roman && !force) {
    return (
      <div className="page"><Link to="/pray">← Pray</Link><h1>Mass mode</h1>
        <p>This guide follows the Roman Mass. {st.tradition === 'byzantine' ? <>For the Byzantine Divine Liturgy use <Link to="/pray/divine-liturgy">the Divine Liturgy page</Link>.</> : <>For the {t.name}, the <Link to="/pray/liturgies">Liturgies page</Link> lists what is in the app and where to find your Church’s books.</>}</p>
        <p><button className="btn" onClick={() => setForce(true)}>Show the Roman Mass anyway</button></p>
      </div>
    );
  }
  const item = (slot: Slot) => rd?.items.find((x) => x.slot === slot);
  const fill = (s: MassStep) => {
    if (!s.fill) return null;
    const it = item(s.fill);
    if (!it) return <p className="muted">Today’s {s.title.toLowerCase()} is not available offline. Open <Link to={`/pray/readings/${date}`}>the readings page</Link>.</p>;
    if (s.fill === 'gospel_acclamation') return <p className="mass-verse">{it.text}</p>;
    return <ReadingBlock refs={it.refs} label={s.title} text={it.text} max={80} />;
  };
  const creedText = BOOK_PRAYERS.find((p) => p.id === 'nicene')?.text;
  const pater = BOOK_PRAYERS.find((p) => p.id === 'pater')?.text;
  const sections = [...new Set(steps.map((s) => s.part))];
  return (
    <div className="page mass-mode" style={{ ['--mass-size' as string]: `${size}px` }}>
      <div className="row between no-print" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Link to="/pray" className="small">← Pray</Link>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn small" onClick={() => { const n = Math.max(16, size - 2); setSize(n); put('sb:mass:size', String(n)); }} aria-label="A−, smaller text">A−</button>
          <button className="btn small" onClick={() => { const n = Math.min(40, size + 2); setSize(n); put('sb:mass:size', String(n)); }} aria-label="A+, larger text">A+</button>
          <button className="btn small" onClick={() => setList(!list)} aria-expanded={list}>All parts</button>
          <Link className="btn small" to="/mass/ef">Extraordinary Form</Link>
          <Link className="btn small" to="/pray/liturgies">Other liturgies</Link>
        </div>
      </div>
      <p className="muted small" style={{ margin: '6px 0' }}>{lit.dayName} · {COLOR_NAME[lit.color]} · Mass (Ordinary Form)</p>
      <div className="mass-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1} aria-label="Progress through the Mass"><i style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>

      {list && (
        <div className="card no-print">
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <label className="small"><input type="checkbox" checked={gloria} onChange={(e) => setGloria(e.target.checked)} /> Gloria</label>
            <label className="small"><input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} /> Second reading</label>
            <label className="small"><input type="checkbox" checked={creed} onChange={(e) => setCreed(e.target.checked)} /> Creed</label>
            <label className="small"><input type="checkbox" checked={awake} onChange={(e) => { setAwake(e.target.checked); put('sb:mass:awake', e.target.checked ? '1' : '0'); }} /> Keep the screen on</label>
          </div>
          {sections.map((p) => <div key={p}><strong className="small">{p}</strong><div className="chips">{steps.map((s, k) => s.part === p && <button key={s.id} className={`chip${k === idx ? ' sel' : ''}`} onClick={() => { go(k); setList(false); }}>{s.title}</button>)}</div></div>)}
        </div>
      )}

      <article className="mass-card" aria-live="polite" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1)); }}>
        <p className="mass-part">{step.part}</p>
        <h1 className="mass-title">{step.title}</h1>
        <p className={`mass-posture ${step.posture}`}><span aria-hidden="true">{POSTURE[step.posture].icon}</span> <strong>{POSTURE[step.posture].label}</strong> <span className="muted small">{POSTURE[step.posture].hint}</span></p>
        <p className="mass-what">{step.what}</p>
        {fill(step)}
        {step.people && step.people.length > 0 && <div className="mass-people"><strong>You:</strong><ul>{step.people.map((p) => <li key={p}>{p}</li>)}</ul></div>}
        {step.id === 'creed' && creedText && <details open><summary>The Nicene Creed (traditional wording)</summary><p style={{ whiteSpace: 'pre-line' }}>{creedText}</p><p className="muted small">Your parish uses the current approved wording, which differs slightly (“We believe” in some places; “consubstantial with the Father” and others). Follow the words in the pew.</p></details>}
        {step.id === 'ourfather' && pater && <details open><summary>The Our Father</summary><p style={{ whiteSpace: 'pre-line' }}>{pater}</p></details>}
        {step.note && <p className="muted small">{step.note}</p>}
      </article>

      <div className="mass-nav no-print">
        <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>← Back</button>
        <span className="muted">{idx + 1} / {steps.length}</span>
        <button className="btn primary" onClick={() => go(idx + 1)} disabled={idx === steps.length - 1}>Next →</button>
      </div>
      <p className="muted small">The long prayers of the Mass (the Roman Missal) are copyrighted and not printed here: follow the words in your missalette. This guide gives the order, the postures and today’s readings. Postures follow the usual United States practice; follow your parish. Tap Next, press the Space bar or swipe.</p>
    </div>
  );
}
