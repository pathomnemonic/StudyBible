import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { passageText } from '../../lib/bibleText';
import { convertRef } from '../../lib/versification';
import { type Ref } from '../../lib/refs';
import { setAmbience, stopAmbience, softBell } from '../../lib/ambience';

/** gentle psalms, in the numbering most Bibles use */
const PSALMS: [number, string][] = [[4, 'In peace I will lie down'], [23, 'The Lord is my shepherd'], [27, 'The Lord is my light'], [34, 'I will bless the Lord at all times'], [42, 'As the deer longs for water'], [46, 'Be still, and know'], [62, 'My soul waits in silence'], [63, 'My soul clings to you'], [84, 'How lovely is your dwelling place'], [91, 'Under his wings'], [103, 'Bless the Lord, O my soul'], [121, 'My help comes from the Lord'], [130, 'Out of the depths'], [131, 'A weaned child at rest'], [139, 'You search me and know me'], [145, 'I will extol you, my God']];
const SOUNDS: [string, string][] = [['chant', 'Chant'], ['hymn', 'Hymns'], ['rain', 'Rain'], ['stream', 'Stream'], ['wind', 'Wind'], ['sea', 'Sea'], ['night', 'Night'], ['music', 'Soft music'], ['classical', 'Piano'], ['off', 'Silence']];
const KEY = 'sb:sleep';
interface Prefs { mode: 'one' | 'on'; psalm: number; sound: string; speak: boolean; speed: number; gap: number; volume: number }
const DEFAULTS: Prefs = { mode: 'on', psalm: 121, sound: 'chant', speak: false, speed: 0.7, gap: 3, volume: 0.3 };
const load = (): Prefs => { try { const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); /* the device voice is now opt-in: older saved choices of it are reset once */ if (!saved.v2) { saved.speak = false; saved.v2 = true; } return { ...DEFAULTS, ...saved }; } catch { return DEFAULTS; } };
const wait = (ms: number, stop: { v: boolean }) => new Promise<void>((res) => { const t = window.setTimeout(res, ms); const c = window.setInterval(() => { if (stop.v) { window.clearTimeout(t); window.clearInterval(c); res(); } }, 300); window.setTimeout(() => window.clearInterval(c), ms + 400); });

/**
 * Sleep mode: a psalm read slowly, one verse at a time, while the sound grows quieter and the screen dims. Read one psalm, or keep
 * reading on through the Psalms until you fall asleep; the shuffle button picks the starting psalm. Speed, the pause between verses
 * and the volume can be changed while it runs.
 */
export default function SleepPage() {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [p, setP] = useState<Prefs>(load);
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<{ psalm: number; v: number; text: string } | null>(null);
  const [dim, setDim] = useState(1);
  const [panel, setPanel] = useState(false);
  const stopRef = useRef({ v: false });
  const live = useRef(p);
  live.current = p;
  const set = (patch: Partial<Prefs>) => setP((x) => { const n = { ...x, ...patch }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } return n; });

  const stop = () => {
    stopRef.current.v = true;
    try { speechSynthesis.cancel(); } catch { /* none */ }
    stopAmbience();
    setRunning(false);
    setPanel(false);
  };
  useEffect(() => () => { stopRef.current.v = true; try { speechSynthesis.cancel(); } catch { /* none */ } stopAmbience(); }, []);

  // sound volume follows the setting, fading quieter as the night goes on
  const began = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const mins = (Date.now() - began.current) / 60000;
      const fade = Math.max(0.15, 1 - mins / 60);
      if (live.current.sound !== 'off') setAmbience(live.current.sound as never, Math.max(0.02, live.current.volume * fade));
      setDim(Math.max(0.12, 1 - mins / 12));
    }, 4000);
    return () => window.clearInterval(id);
  }, [running]);

  const shuffle = () => {
    const pool = PSALMS.map(([n]) => n).filter((n) => n !== p.psalm);
    set({ psalm: pool[Math.floor(Math.random() * pool.length)] });
  };

  const start = async () => {
    if (!edition) return;
    const stopper = { v: false };
    stopRef.current = stopper;
    began.current = Date.now();
    setRunning(true);
    setDim(1);
    if (p.sound !== 'off') setAmbience(p.sound as never, p.volume);
    let n = p.psalm;
    while (!stopper.v) {
      const ref: Ref = convertRef('kjv', 'vulgate', { book: 'PSA', c1: n, c2: n }).ref;
      const vs = await passageText(edition, { ...ref, v1: undefined, v2: undefined }, 80);
      for (const v of vs) {
        if (stopper.v) return;
        setShown({ psalm: n, v: v.v, text: v.text });
        const cur = live.current;
        if (cur.speak && typeof speechSynthesis !== 'undefined') {
          await new Promise<void>((res) => {
            const u = new SpeechSynthesisUtterance(v.text);
            u.rate = live.current.speed; u.pitch = 0.9; u.volume = 0.7;
            u.onend = () => res(); u.onerror = () => res();
            speechSynthesis.cancel();
            speechSynthesis.speak(u);
            const guard = window.setInterval(() => { if (stopper.v) { window.clearInterval(guard); res(); } }, 400);
            u.onend = () => { window.clearInterval(guard); res(); };
          });
        } else {
          // no voice: give the eye time to read it, a little slower at lower speeds
          await wait((2500 + v.text.split(/\s+/).length * 330) / Math.max(0.4, live.current.speed), stopper);
        }
        await wait(live.current.gap * 1000, stopper);
      }
      if (stopper.v) return;
      if (live.current.mode === 'one') { await wait(4000, stopper); if (!stopper.v) { softBell(); stop(); } return; }
      await wait(6000, stopper); // a longer rest between psalms
      n = n >= 150 ? 1 : n + 1;
    }
  };

  if (running) {
    return (
      <div className="sleep-screen" style={{ opacity: dim }} role="region" aria-label="Sleep mode" aria-live="off" onClick={() => panel && setPanel(false)}>
        <p className="sleep-text" key={`${shown?.psalm}.${shown?.v}`}>{shown?.text}</p>
        <p className="sleep-ref">{shown ? `Psalm ${shown.psalm}:${shown.v}` : ''}</p>
        <button className="btn ghost" onClick={stop}>End now</button>
        <button className="sleep-gear" aria-label="Speed and sound" aria-expanded={panel} onClick={(e) => { e.stopPropagation(); setPanel(!panel); setDim(1); }}>⚙</button>
        {panel && (
          <div className="sleep-panel" onClick={(e) => e.stopPropagation()}>
            <label>Reading speed <input type="range" min={0.5} max={1.1} step={0.05} value={p.speed} onChange={(e) => set({ speed: +e.target.value })} /></label>
            <label>Pause between verses <input type="range" min={0} max={10} step={1} value={p.gap} onChange={(e) => set({ gap: +e.target.value })} /> <span>{p.gap}s</span></label>
            <label>Sound volume <input type="range" min={0.05} max={0.8} step={0.05} value={p.volume} onChange={(e) => set({ volume: +e.target.value })} /></label>
            <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={p.speak} onChange={(e) => { set({ speak: e.target.checked }); if (!e.target.checked) try { speechSynthesis.cancel(); } catch { /* none */ } }} /> Read aloud</label>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="page">
      <h1>Sleep mode</h1>
      <p className="lede">A psalm read slowly, one verse at a time, while the sound grows quieter and the screen dims. Put the phone down and let it carry you.</p>
      <div className="card">
        <div className="field"><span>What to read</span>
          <div className="chips">
            <button className={`chip${p.mode === 'one' ? ' sel' : ''}`} aria-pressed={p.mode === 'one'} onClick={() => set({ mode: 'one' })}>One psalm, then stop</button>
            <button className={`chip${p.mode === 'on' ? ' sel' : ''}`} aria-pressed={p.mode === 'on'} onClick={() => set({ mode: 'on' })}>Keep reading on</button>
          </div>
        </div>
        <div className="field"><span>{p.mode === 'on' ? 'Start with' : 'Psalm'}</span>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <select value={PSALMS.some(([n]) => n === p.psalm) ? p.psalm : ''} onChange={(e) => set({ psalm: +e.target.value })} style={{ flex: 1 }}>
              {!PSALMS.some(([n]) => n === p.psalm) && <option value="">Psalm {p.psalm}</option>}
              {PSALMS.map(([n, d]) => <option key={n} value={n}>Psalm {n}: {d}</option>)}
            </select>
            <button className="btn" onClick={shuffle} aria-label="Pick a psalm at random" title="Pick one at random">🎲 Surprise me</button>
          </div>
          {p.mode === 'on' && <p className="muted small" style={{ margin: '6px 0 0' }}>Carries on through the next psalms (Psalm {p.psalm + 1 > 150 ? 1 : p.psalm + 1}, and so on) until you stop it or fall asleep. It grows quieter and dimmer as it goes.</p>}
        </div>
        <div className="field"><span>Sound</span><div className="chips">{SOUNDS.map(([k, l]) => <button key={k} className={`chip${p.sound === k ? ' sel' : ''}`} aria-pressed={p.sound === k} onClick={() => set({ sound: k })}>{l}</button>)}</div></div>
        <label className="row" style={{ gap: 8, margin: '8px 0' }}><input type="checkbox" checked={p.speak} onChange={(e) => set({ speak: e.target.checked })} /> Also read it aloud in your device’s voice (off by default: recorded chant and sound are better for sleep)</label>
        <button className="btn primary" onClick={start}>Begin</button>
        <p className="muted small">Once it begins, tap the small ⚙ to change the speed, the pause between verses or the volume. Psalm numbers follow the numbering used in most Bibles. Browsers may need one tap before sound can play.</p>
      </div>
    </div>
  );
}
