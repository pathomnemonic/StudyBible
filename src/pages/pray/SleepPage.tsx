import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { passageText } from '../../lib/bibleText';
import { convertRef } from '../../lib/versification';
import { parseRefs, type Ref } from '../../lib/refs';
import { setAmbience, stopAmbience, softBell } from '../../lib/ambience';

const PSALMS: [string, string][] = [['Psalm 4', 'In peace I will lie down'], ['Psalm 23', 'The Lord is my shepherd'], ['Psalm 91', 'Under his wings'], ['Psalm 121', 'My help comes from the Lord'], ['Psalm 131', 'A weaned child at rest'], ['Psalm 139', 'You search me and know me'], ['Psalm 63', 'My soul clings to you'], ['Psalm 130', 'Out of the depths']];
const LENGTHS = [10, 20, 30];
const SOUNDS: [string, string][] = [['rain', 'Rain'], ['stream', 'Stream'], ['wind', 'Wind'], ['music', 'Soft music'], ['classical', 'Piano'], ['off', 'Silence']];

/** Sleep mode: one psalm shown and (optionally) read slowly, one verse at a time, while the sound fades to nothing and the screen dims. */
export default function SleepPage() {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [psalm, setPsalm] = useState(PSALMS[3][0]);
  const [mins, setMins] = useState(20);
  const [sound, setSound] = useState<string>('rain');
  const [speak, setSpeak] = useState(true);
  const [running, setRunning] = useState(false);
  const [verses, setVerses] = useState<{ v: number; text: string }[]>([]);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const timers = useRef<number[]>([]);

  const stop = () => {
    timers.current.forEach((t) => window.clearInterval(t));
    timers.current = [];
    try { speechSynthesis.cancel(); } catch { /* none */ }
    stopAmbience();
    setRunning(false);
  };
  useEffect(() => stop, []);

  const start = async () => {
    const p = parseRefs(psalm);
    if (!p.ok || !edition) return;
    const ref: Ref = convertRef('kjv', 'vulgate', p.refs[0].ref).ref;
    const vs = (await passageText(edition, { ...ref, v1: undefined, v2: undefined }, 60)).map((x) => ({ v: x.v, text: x.text }));
    setVerses(vs);
    setIdx(0);
    setRunning(true);
    const total = mins * 60;
    setLeft(total);
    const startAt = Date.now();
    if (sound !== 'off') setAmbience(sound as any, 0.3);
    const perVerse = Math.max(9, Math.min(40, (total * 0.8) / Math.max(1, vs.length)));
    let i = 0;
    const say = (n: number) => {
      if (!speak || typeof speechSynthesis === 'undefined' || !vs[n]) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(vs[n].text);
      u.rate = 0.68;
      u.pitch = 0.9;
      u.volume = 0.7;
      speechSynthesis.speak(u);
    };
    say(0);
    timers.current.push(window.setInterval(() => { i = Math.min(vs.length, i + 1); if (i < vs.length) { setIdx(i); say(i); } }, perVerse * 1000));
    timers.current.push(window.setInterval(() => {
      const elapsed = (Date.now() - startAt) / 1000;
      const remain = Math.max(0, total - elapsed);
      setLeft(remain);
      // the sound fades over the whole session, to nothing in the last fifth
      if (sound !== 'off') setAmbience(sound as any, Math.max(0.02, 0.3 * Math.min(1, remain / (total * 0.8))));
      if (remain <= 0) { stop(); softBell(); }
    }, 5000));
  };

  if (running) {
    const dim = Math.max(0.15, Math.min(1, left / (mins * 60 * 0.6)));
    return (
      <div className="sleep-screen" style={{ opacity: dim }} role="region" aria-label="Sleep mode" aria-live="off">
        <p className="sleep-text" key={idx}>{verses[idx]?.text}</p>
        <p className="sleep-ref">{psalm}{verses[idx] ? `:${verses[idx].v}` : ''}</p>
        <button className="btn ghost" onClick={stop}>End now</button>
      </div>
    );
  }
  return (
    <div className="page">
      <Link to="/pray" className="small">← Prayer</Link>
      <h1>Sleep mode</h1>
      <p className="lede">A psalm, read slowly, one verse at a time, while the sound grows quieter and the screen fades. Put the phone down and let it finish.</p>
      <div className="card">
        <label className="field"><span>Psalm</span>
          <select value={psalm} onChange={(e) => setPsalm(e.target.value)}>{PSALMS.map(([p, d]) => <option key={p} value={p}>{p}: {d}</option>)}</select>
        </label>
        <div className="field"><span>How long</span><div className="chips">{LENGTHS.map((m) => <button key={m} className={`chip${mins === m ? ' sel' : ''}`} aria-pressed={mins === m} onClick={() => setMins(m)}>{m} minutes</button>)}</div></div>
        <div className="field"><span>Sound</span><div className="chips">{SOUNDS.map(([k, l]) => <button key={k} className={`chip${sound === k ? ' sel' : ''}`} aria-pressed={sound === k} onClick={() => setSound(k)}>{l}</button>)}</div></div>
        <label className="row" style={{ gap: 8, margin: '8px 0' }}><input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} /> Read it aloud, slowly (your device’s voice)</label>
        <button className="btn primary" onClick={start}>Begin</button>
        <p className="muted small">Psalm numbers follow the Hebrew/English numbering used in most Bibles. Browsers may need one tap before sound can play, and keep the screen awake only while this page is open.</p>
      </div>
    </div>
  );
}
