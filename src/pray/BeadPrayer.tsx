import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import ReadingBlock from '../components/ReadingBlock';
import { usePlayer } from '../data/PlayerContext';
import type { BiayEpisode } from '../data/content';
import { buzz } from '../lib/haptics';
import { useSettings } from '../lib/store';
import { useWakeLock } from '../lib/wakeLock';
import Beads from './Beads';
import { useDock } from './useDock';
import { usePic } from './art';
import { stepAt, stepTimes, stepWeight, type Plan } from './plan';
import { toRefs } from './refs';
import { SPEEDS, useGuide, voiceSupported, type Mode } from './useGuide';

const key = (id: string) => `sb:pray:${id}`;
const load = (id: string, max: number) => { try { const n = Number(localStorage.getItem(key(id))); return n > 0 && n < max ? n : 0; } catch { return 0; } };
const save = (id: string, n: number) => { try { n > 0 ? localStorage.setItem(key(id), String(n)) : localStorage.removeItem(key(id)); } catch { /* private mode */ } };
const bump = (id: string) => { try { const k = `sb:pray:done:${id}`; const n = Number(localStorage.getItem(k) ?? 0) + 1; localStorage.setItem(k, String(n)); return n; } catch { return 1; } };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Prays a rosary-bead devotion bead by bead: the beads are drawn and the one being prayed glows, each mystery has a picture and its Scripture,
 * and the prayer can be moved along by tapping, by a steady pace, by the device's voice, or by following a recording.
 */
export default function BeadPrayer({ plan, art, episode, back, backLabel, intro, startMode }: { plan: Plan; art: string[]; episode?: BiayEpisode; back: string; backLabel: string; intro?: string; startMode?: Mode }) {
  const [s] = useSettings();
  useWakeLock(s.keepAwake);
  const dock = useDock();
  const player = usePlayer();
  const [i, setI] = useState(() => load(plan.id, plan.steps.length));
  const [mode, setMode] = useState<Mode>('tap');
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [follow, setFollow] = useState(true);
  const [offset, setOffset] = useState(0);
  const [finished, setFinished] = useState(false);
  const [times, setTimes] = useState(0);
  const last = plan.steps.length - 1;
  const step = plan.steps[i];
  const refs = useMemo(() => (step.refs ? toRefs(step.refs) : []), [step.refs]);
  const decade = step.decade;
  const pic = usePic(decade !== undefined ? art[decade] : null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => { if (!finished) save(plan.id, i); }, [i, finished, plan.id]);
  useEffect(() => { setI(load(plan.id, plan.steps.length)); setFinished(false); }, [plan.id]);

  const go = (n: number) => {
    const c = Math.max(0, Math.min(last, n));
    if (c !== i) buzz();
    setI(c);
  };
  const finish = () => { setTimes(bump(plan.id)); setFinished(true); save(plan.id, 0); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); setRunning(false); };
  const next = () => (i >= last ? finish() : go(i + 1));

  const audioOn = mode === 'audio' && !!episode && player.current?.id === episode.id;
  const dur = audioOn && player.duration > 0 ? player.duration : episode?.duration ?? 0;
  const stepStart = useMemo(() => stepTimes(plan.steps, dur || 1), [plan.steps, dur]);
  // with the recording playing, the beads follow it; tapping Next or Back lines them up again
  useEffect(() => {
    if (!audioOn || !follow || !player.playing || !dur) return;
    const idx = stepAt(plan.steps, dur, Math.max(0, player.position - offset));
    if (idx !== i) setI(idx);
  }, [audioOn, follow, player.position, player.playing, offset, dur]);
  const nudge = (target: number) => { if (audioOn) setOffset(player.position - stepStart[target]); };

  useGuide({
    mode, running: running && !finished, index: i, last, speed, seconds: (n) => stepWeight(plan.steps[n]),
    speech: (n) => { const t = plan.steps[n]; return t.kind === 'mystery' ? `${t.title}. ${t.note ?? ''}` : t.kind === 'ave' && t.of ? `${t.title}. ${t.text}` : `${t.title}. ${t.text ?? ''}`; },
    onNext: next,
  });

  const manualGo = (n: number) => { const c = Math.max(0, Math.min(last, n)); if (n > last) return finish(); go(c); nudge(c); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); manualGo(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); manualGo(i - 1); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const jumpDecade = (d: number | 'start' | 'end') => {
    const idx = d === 'start' ? 0 : d === 'end' ? plan.steps.findIndex((x) => x.kind === 'salve' || (x.decade === undefined && x.of?.[0] === 1 && x.title === 'Holy God')) : plan.steps.findIndex((x) => x.decade === d);
    if (idx >= 0) { go(idx); nudge(idx); }
  };
  const restart = () => { setFinished(false); setI(0); setOffset(0); setRunning(true); save(plan.id, 0); };
  const choose = (m: Mode) => {
    setMode(m);
    setRunning(true);
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (m === 'audio' && episode) void player.play(episode, 0).then(() => setOffset(0));
    else if (player.current?.id === episode?.id && player.playing) player.toggle();
  };

  useEffect(() => { if (startMode && startMode !== 'tap') choose(startMode); }, []);

  const pct = (100 * i) / last;
  const decades = plan.decades;
  if (finished) {
    return (
      <div className="page rosary-page">
        <p><Link to={back}>← {backLabel}</Link></p>
        <section className="card rosary-done" aria-live="polite">
          <h1>Amen.</h1>
          <p className="lede">You prayed {plan.name}. {times > 1 ? `That is ${times} times on this device.` : 'May it bear fruit in your day.'}</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn primary" onClick={restart}>Pray it again</button>
            <Link className="btn" to={back}>{backLabel}</Link>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="page rosary-page">
      <p><Link to={back}>← {backLabel}</Link></p>
      <h1>{plan.name}</h1>
      {intro && <p className="muted small">{intro}</p>}

      <div className="rosary-modes" role="radiogroup" aria-label="How would you like to pray?">
        {([['tap', 'I’ll tap', 'Tap Next on each bead'], ['pace', 'Set the pace', 'Beads move at a steady speed'], ['voice', 'Lead me', 'Your device reads each prayer'], ...(episode ? [['audio', 'Pray with me', 'Follow the Creedal recording']] : [])] as [Mode, string, string][]).map(([m, l, d]) => (
          <button key={m} role="radio" aria-checked={mode === m} className={`mode${mode === m ? ' on' : ''}`} onClick={() => choose(m)} disabled={m === 'voice' && !voiceSupported()} title={m === 'voice' && !voiceSupported() ? 'This browser has no speech voice' : d}>
            <strong>{l}</strong><span>{d}</span>
          </button>
        ))}
      </div>

      {(mode === 'pace' || mode === 'voice') && (
        <div className="row rosary-speed" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn small primary" onClick={() => { setRunning(!running); if (running && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }}>{running ? 'Pause' : 'Resume'}</button>
          <span className="muted small">Speed</span>
          <div role="radiogroup" aria-label="Speed" className="row" style={{ gap: 4 }}>
            {SPEEDS.map((v, n) => <button key={v.label} role="radio" aria-checked={speed === n} className={`btn small${speed === n ? ' primary' : ''}`} onClick={() => setSpeed(n)}>{v.label}</button>)}
          </div>
        </div>
      )}

      {mode === 'audio' && episode && (
        <section className="card rosary-audio" aria-label="Recording">
          <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
            <div>
              <strong>{episode.short}</strong> <span className="muted small">· Creedal, “The Holy Rosary” · {fmt(episode.duration ?? 0)}</span>
            </div>
            {audioOn
              ? <div className="row" style={{ gap: 6 }}>
                  <button className="btn small" onClick={() => player.skip(-15)} aria-label="Back 15 seconds">−15s</button>
                  <button className="btn small primary" onClick={player.toggle}>{player.playing ? 'Pause' : 'Play'}</button>
                  <button className="btn small" onClick={() => player.skip(30)} aria-label="Forward 30 seconds">+30s</button>
                </div>
              : <button className="btn small primary" onClick={() => void player.play(episode, 0)}>Play the recording</button>}
          </div>
          {audioOn && <div className="progress" aria-hidden style={{ margin: '8px 0 2px' }}><div style={{ width: `${dur ? (100 * player.position) / dur : 0}%` }} /></div>}
          <label className="row" style={{ gap: 8, marginTop: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
            <span className="small">Move the beads with the recording</span>
          </label>
          <p className="muted small" style={{ margin: '6px 0 0' }}>The beads keep time by the length of each prayer, so they can drift a little. Tap Next or Back to line them up with the voice. The audio is streamed from the Creedal podcast; <a href={episode.page} target="_blank" rel="noreferrer">its page</a> has the original.</p>
        </section>
      )}

      <div className="rosary-grid">
        <div className="rosary-left">
          <Beads plan={plan} step={i} onJump={(n) => { go(n); nudge(n); }} />
          <div className="chips rosary-jump" role="group" aria-label="Jump to">
            <button className="chip" onClick={() => jumpDecade('start')}>Start</button>
            {Array.from({ length: decades }, (_, d) => <button key={d} className={`chip${decade === d ? ' sel' : ''}`} aria-pressed={decade === d} onClick={() => jumpDecade(d)}>{d + 1}</button>)}
            <button className="chip" onClick={() => jumpDecade('end')}>End</button>
          </div>
        </div>
        <div className="rosary-right">
          {decade !== undefined && (
            <figure className="rosary-art">
              {pic ? <img src={`${base}${pic.file}`} alt={`${pic.title}, ${pic.artist}`} loading="lazy" decoding="async" /> : <div className="rosary-art-ph" aria-hidden />}
              {pic && <figcaption className="muted small">{pic.title} · {pic.artist}{pic.date ? `, ${pic.date}` : ''} · <a href={pic.source ?? '#/study/gallery'} target={pic.source ? '_blank' : undefined} rel="noreferrer">source</a></figcaption>}
            </figure>
          )}
          <section className="card rosary-card" aria-live="polite">
            <div className="row between" style={{ alignItems: 'baseline' }}>
              <h2 className="card-title" style={{ margin: 0 }}>{step.title}</h2>
              {step.of && <span className="chip rosary-count" aria-label={`${step.of[0]} of ${step.of[1]}`}>{step.of[0]} / {step.of[1]}</span>}
            </div>
            {step.note && <p className="muted small">{step.note}</p>}
            {refs.length > 0 && <ReadingBlock refs={refs} label="Scripture" text={step.refs!} max={9} />}
            {step.text && <p className="scripture rosary-text">{step.text}</p>}
            {step.kind === 'ave' && step.of && (
              <div className="rosary-dots" aria-hidden>{Array.from({ length: step.of[1] }, (_, n) => <i key={n} className={n < step.of![0] ? 'on' : ''} />)}</div>
            )}
          </section>
          <div className="progress" aria-hidden><div style={{ width: `${pct}%` }} /></div>
          <p className="muted small" style={{ margin: '4px 0 8px' }}>Prayer {i + 1} of {plan.steps.length}</p>
        </div>
      </div>

      {createPortal(
        <div className="rosary-bar" style={dock !== undefined ? { bottom: dock } : undefined}>
          <button className="btn" onClick={() => manualGo(i - 1)} disabled={i === 0}>Back</button>
          <button className="btn primary big" onClick={() => manualGo(i + 1)} aria-label={i >= last ? 'Amen, finish' : 'Next prayer'}>{i >= last ? 'Amen' : step.kind === 'ave' ? 'Hail Mary said' : 'Next'}</button>
          <button className="btn" onClick={restart} title="Start again from the crucifix">Restart</button>
        </div>,
        document.body,
      )}
    </div>
  );
}
