import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import ReadingBlock from '../components/ReadingBlock';
import type { Devotion } from '../data/devotions';
import { buzz } from '../lib/haptics';
import { useSettings } from '../lib/store';
import { useWakeLock } from '../lib/wakeLock';
import { useDock } from './useDock';
import { usePic } from './art';
import { bell } from './bell';
import { toRefs } from './refs';
import { SPEEDS, useGuide, voiceSupported, type Mode } from './useGuide';

interface Tick { step: number; n: number; of: number }

/** A prayer said one step at a time (Angelus, Stations, chaplets), with a picture where there is one, a bell for the Angelus, and the same ways of being led as the rosary. */
export default function StepPrayer({ d, back, art, bells }: { d: Devotion; back: string; art?: (stepIndex: number) => string | null; bells?: Record<number, number> }) {
  const [s] = useSettings();
  useWakeLock(s.keepAwake);
  const dock = useDock();
  const ticks = useMemo<Tick[]>(() => d.steps.flatMap((st, step) => Array.from({ length: st.count ?? 1 }, (_, n): Tick => ({ step, n, of: st.count ?? 1 }))), [d]);
  const [t, setT] = useState(0);
  const [mode, setMode] = useState<Mode>('tap');
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [ring, setRing] = useState(!!bells);
  const [done, setDone] = useState(false);
  const tick = ticks[t];
  const step = d.steps[tick.step];
  const last = ticks.length - 1;
  const refs = useMemo(() => (step.refs ? toRefs(step.refs) : []), [step.refs]);
  const pic = usePic(art?.(tick.step) ?? null);
  const base = import.meta.env.BASE_URL;
  const go = (n: number) => { const c = Math.max(0, Math.min(last, n)); if (c !== t) { buzz(); setT(c); } };
  const next = () => (t >= last ? (setDone(true), setRunning(false)) : go(t + 1));
  useEffect(() => { if (ring && bells && tick.n === 0 && bells[tick.step]) bell(bells[tick.step]); }, [t, ring]);
  useGuide({
    mode, running: running && !done, index: t, last, speed,
    seconds: (n) => Math.max(2.5, (d.steps[ticks[n].step].text ?? '').split(/\s+/).length / 3 + 1.2),
    speech: (n) => { const x = ticks[n]; const st = d.steps[x.step]; return x.n === 0 ? `${st.title}. ${st.text ?? ''}` : st.text ?? ''; },
    onNext: next,
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(t - 1); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const choose = (m: Mode) => { setMode(m); setRunning(true); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); };
  if (done) {
    return (
      <div className="page rosary-page">
        <p><Link to={back}>← Devotions</Link></p>
        <section className="card rosary-done"><h1>Amen.</h1><p className="lede">You prayed {d.name}.</p>
          <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}><button className="btn primary" onClick={() => { setDone(false); setT(0); setRunning(true); }}>Pray it again</button><Link className="btn" to={back}>Devotions</Link></div>
        </section>
      </div>
    );
  }
  const stepNo = tick.step + 1;
  return (
    <div className="page rosary-page">
      <p><Link to={back}>← Devotions</Link></p>
      <h1>{d.name}</h1>
      <div className="rosary-modes" role="radiogroup" aria-label="How would you like to pray?">
        {([['tap', 'I’ll tap', 'Tap Next at each step'], ['pace', 'Set the pace', 'Moves at a steady speed'], ['voice', 'Lead me', 'Your device reads each prayer']] as [Mode, string, string][]).map(([m, l, x]) => (
          <button key={m} role="radio" aria-checked={mode === m} className={`mode${mode === m ? ' on' : ''}`} onClick={() => choose(m)} disabled={m === 'voice' && !voiceSupported()} title={x}><strong>{l}</strong><span>{x}</span></button>
        ))}
      </div>
      {(mode === 'pace' || mode === 'voice') && (
        <div className="row rosary-speed" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn small primary" onClick={() => { setRunning(!running); if (running && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }}>{running ? 'Pause' : 'Resume'}</button>
          <span className="muted small">Speed</span>
          <div role="radiogroup" aria-label="Speed" className="row" style={{ gap: 4 }}>{SPEEDS.map((v, n) => <button key={v.label} role="radio" aria-checked={speed === n} className={`btn small${speed === n ? ' primary' : ''}`} onClick={() => setSpeed(n)}>{v.label}</button>)}</div>
        </div>
      )}
      {bells && (
        <label className="row" style={{ gap: 8, alignItems: 'center', margin: '6px 0' }}>
          <input type="checkbox" checked={ring} onChange={(e) => setRing(e.target.checked)} /><span className="small">Ring the Angelus bell (three, three, three)</span>
          <button className="btn small" onClick={() => bell(3)}>Ring</button>
        </label>
      )}
      <div className="progress" aria-hidden><div style={{ width: `${(100 * t) / last}%` }} /></div>
      <p className="muted small">Step {stepNo} of {d.steps.length}</p>
      <div className="rosary-right" style={{ maxWidth: 680 }}>
        {pic && (
          <figure className="rosary-art">
            <img src={`${base}${pic.file}`} alt={`${pic.title}, ${pic.artist}`} loading="lazy" decoding="async" />
            <figcaption className="muted small">{pic.title} · {pic.artist}{pic.date ? `, ${pic.date}` : ''}</figcaption>
          </figure>
        )}
        <section className="card rosary-card" aria-live="polite">
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <h2 className="card-title" style={{ margin: 0 }}>{step.title}</h2>
            {tick.of > 1 && <span className="chip rosary-count" aria-label={`${tick.n + 1} of ${tick.of}`}>{tick.n + 1} / {tick.of}</span>}
          </div>
          {step.note && <p className="muted small">{step.note}</p>}
          {refs.length > 0 && <ReadingBlock refs={refs} label="Scripture" text={step.refs!} max={9} />}
          {step.text && <p className="scripture rosary-text">{step.text}</p>}
          {tick.of > 1 && <div className="rosary-dots" aria-hidden>{Array.from({ length: tick.of }, (_, n) => <i key={n} className={n <= tick.n ? 'on' : ''} />)}</div>}
        </section>
      </div>
      {createPortal(
        <div className="rosary-bar" style={dock !== undefined ? { bottom: dock } : undefined}>
          <button className="btn" onClick={() => go(t - 1)} disabled={t === 0}>Back</button>
          <button className="btn primary big" onClick={next}>{t >= last ? 'Amen' : tick.of > 1 ? 'Said one' : 'Next'}</button>
          <button className="btn" onClick={() => { setT(0); setRunning(true); }}>Restart</button>
        </div>,
        document.body,
      )}
    </div>
  );
}
