import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { passageText } from '../../lib/bibleText';
import { readingsFor } from '../../liturgy/readings';
import { byzantineDay } from '../../liturgy/byzantine';
import { convertRef } from '../../lib/versification';
import { type Ref } from '../../lib/refs';
import { setAmbience, stopAmbience, softBell, type SoundKind } from '../../lib/ambience';
import { useWakeLock } from '../../lib/wakeLock';
import { PRAYERS } from '../../data/prayers';

const KEY = 'sb:morning';
const SOUNDS: [SoundKind, string][] = [['stream', 'Stream'], ['wind', 'Wind'], ['nature', 'Birdsong and nature'], ['music', 'Soft music'], ['off', 'No sound']];
interface Prefs { time: string; sound: SoundKind; volume: number; speak: boolean }
const DEFAULTS: Prefs = { time: '06:30', sound: 'nature', volume: 0.25, speak: true };
const load = (): Prefs => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULTS; } };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Morning mode, the counterpart of sleep mode. Arm it for a time and leave the app open (it keeps the screen awake, dimmed): at that time
 * the sound rises gently, a bell rings, and the day's Gospel is shown and read aloud, followed by a short morning prayer.
 * A web page cannot wake a phone that is locked or has the app closed, so this is not an alarm clock: use it with the phone on a charger.
 */
export default function MorningPage() {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [p, setP] = useState<Prefs>(load);
  const [armed, setArmed] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'armed' | 'awake'>('idle');
  const [gospel, setGospel] = useState<{ label: string; verses: { v: number; text: string }[] } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const set = (patch: Partial<Prefs>) => setP((x) => { const n = { ...x, ...patch }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } return n; });
  useWakeLock(armed);

  const stop = () => { window.clearTimeout(timer.current); try { speechSynthesis.cancel(); } catch { /* none */ } stopAmbience(); setArmed(false); setPhase('idle'); };
  useEffect(() => () => { window.clearTimeout(timer.current); try { speechSynthesis.cancel(); } catch { /* none */ } stopAmbience(); }, []);

  const todaysGospel = async (): Promise<{ label: string; refs: Ref[] } | null> => {
    const today = iso(new Date());
    if (s.tradition === 'byzantine') {
      const d = await byzantineDay(today, s.oldCalendar);
      const g = d?.readings.find((r) => r.source === 'Gospel');
      if (g && g.refs.length) return { label: g.display, refs: g.refs };
    }
    const rd = await readingsFor(s.diocese, today);
    const g = rd.items.find((i) => i.slot === 'gospel');
    if (g && g.refs.length) return { label: g.text, refs: g.refs };
    // no reading on file for today: the morning psalm
    return { label: 'Psalm 63', refs: [convertRef('kjv', 'vulgate', { book: 'PSA', c1: 63, c2: 63 }).ref] };
  };

  const wake = async () => {
    setPhase('awake');
    let v = 0.02;
    if (p.sound !== 'off') {
      setAmbience(p.sound, v);
      const up = window.setInterval(() => { v = Math.min(p.volume, v + p.volume / 20); setAmbience(p.sound, v); if (v >= p.volume) window.clearInterval(up); }, 6000);
    }
    softBell();
    const g = await todaysGospel();
    if (g && edition) {
      const verses = (await Promise.all(g.refs.map((r) => passageText(edition, r, 40)))).flat();
      setGospel({ label: g.label, verses });
      if (p.speak && 'speechSynthesis' in window) {
        window.setTimeout(() => { const u = new SpeechSynthesisUtterance(verses.map((x) => x.text).join(' ')); u.lang = edition.language; u.rate = 0.9; speechSynthesis.speak(u); }, 90_000); // the sound rises first
      }
    }
  };

  const arm = () => {
    const [h, m] = p.time.split(':').map(Number);
    const at = new Date(); at.setHours(h, m, 0, 0);
    if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
    setArmed(true); setPhase('armed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(wake, at.getTime() - Date.now());
  };
  const offering = PRAYERS.find((x) => x.id === 'hail-mary');

  return (
    <div className="page narrow">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Morning mode</h1>
      <p className="lede">Wake to a quiet start: the sound rises slowly, a bell rings, and the day’s Gospel is shown and read aloud.</p>
      {phase !== 'awake' && (
        <section className="card">
          <label className="row between"><span>Wake me at</span><input type="time" value={p.time} onChange={(e) => set({ time: e.target.value })} aria-label="Time" disabled={armed} /></label>
          <label className="row between" style={{ marginTop: 8 }}><span>Sound</span>
            <select value={p.sound} onChange={(e) => set({ sound: e.target.value as SoundKind })} aria-label="Sound" disabled={armed}>{SOUNDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
          <label className="row between" style={{ marginTop: 8 }}><span>Read the Gospel aloud</span><input type="checkbox" checked={p.speak} onChange={(e) => set({ speak: e.target.checked })} aria-label="Read aloud" disabled={armed} /></label>
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            {!armed ? <button className="btn primary" onClick={arm}>Arm for {p.time}</button> : <button className="btn" onClick={stop}>Disarm</button>}
            <button className="btn" onClick={() => { stop(); void wake(); }}>Start now</button>
          </div>
          {armed && <p className="muted small" role="status">Armed. Leave this page open with the phone charging; the screen stays on.</p>}
          <p className="muted small">A web page cannot wake a phone that is locked or has the app closed. Keep the app open and the phone plugged in, or use your phone’s own alarm and open this page when you wake.</p>
        </section>
      )}
      {phase === 'awake' && (
        <section className="card" aria-live="polite">
          <h2 className="card-title">Good morning</h2>
          {gospel ? (
            <>
              <div className="eyebrow">Today’s Gospel · {gospel.label}</div>
              <p className="scripture reading-text">{gospel.verses.map((v) => <span key={v.v}><sup>{v.v}</sup>{v.text} </span>)}</p>
              <p className="muted small">{edition?.shortName}</p>
            </>
          ) : <p className="muted">Finding today’s reading…</p>}
          {offering && <p className="small muted">Close with a Hail Mary: {offering.text}</p>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={stop}>Stop sound</button>
            <Link className="btn primary" to="/pray/office">Pray the morning hour</Link>
            <Link className="btn" to="/pray/readings">All the readings</Link>
          </div>
        </section>
      )}
    </div>
  );
}
