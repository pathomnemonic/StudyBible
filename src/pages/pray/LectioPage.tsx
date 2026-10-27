import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { formatRef, parseRefId, parseRefs, refId, type Ref } from '../../lib/refs';
import { passageText } from '../../lib/bibleText';
import { convertRef } from '../../lib/versification';
import { PRAYERS } from '../../data/prayers';

const STEPS = [
  { key: 'lectio', name: 'Lectio — Read', prompt: 'Read the passage slowly, perhaps aloud. Let a word or phrase stand out. There is no need to hurry.' },
  { key: 'meditatio', name: 'Meditatio — Reflect', prompt: 'Return to the word or phrase that stayed with you. What might God be saying to you through it today?' },
  { key: 'oratio', name: 'Oratio — Pray', prompt: 'Answer in your own words: thanks, sorrow, petition, praise. Speak honestly.' },
  { key: 'contemplatio', name: 'Contemplatio — Rest', prompt: 'Be still in God’s presence. You may simply repeat the word or phrase quietly, or sit in silence.' },
] as const;

export default function LectioPage() {
  const [sp] = useSearchParams();
  const { get, editions } = useEditions();
  const [s, set] = useSettings();
  const ed = get(s.defaultEdition) ?? editions[0];
  const [input, setInput] = useState(sp.get('ref') ?? 'Lk 15:11-24');
  const [ref, setRef] = useState<Ref | null>(null);
  const [err, setErr] = useState('');
  const [text, setText] = useState<{ v: number; text: string }[]>([]);
  const [step, setStep] = useState(-1);
  const [left, setLeft] = useState(0);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const [minutes, setMinutes] = useState(s.lectioMinutes);
  const timer = useRef<number | undefined>(undefined);
  // earlier times you prayed with this same passage: the reflection comes back to you
  const earlier = useLiveQuery(async () => (ref ? (await db.journal.toArray()).filter((j) => (j.refs ?? []).includes(refId(ref))).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3) : []), [ref ? refId(ref) : ''], []) ?? [];

  const choose = () => {
    const r = parseRefs(input);
    if (!r.ok) return setErr(r.error);
    setErr('');
    const a = r.refs[0].ref;
    // typed numbers: English tradition unless the user's setting says Vulgate
    const anchor = s.refNumbering === 'vulgate' ? a : convertRef(ed.scheme === 'vulgate' && s.refNumbering === 'edition' ? 'vulgate' : 'kjv', 'vulgate', a).ref;
    setRef(anchor);
  };
  useEffect(() => {
    const q = sp.get('ref');
    if (q) {
      const p = parseRefId(q);
      if (p) {
        setRef(p);
        setInput(formatRef(p));
      }
    } else choose();
  }, []);
  useEffect(() => {
    if (ref) passageText(ed, ref, 40).then(setText);
  }, [ref, ed.id]);

  const stepSecs = (minutes * 60) / 4;
  useEffect(() => {
    if (step < 0 || step > 3) return;
    setLeft(stepSecs);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => window.clearInterval(timer.current);
  }, [step, minutes]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.map((t) => t.text).join(' '));
    u.lang = ed.language;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };
  const saveToJournal = async () => {
    if (!ref) return;
    const d = new Date();
    await db.journal.add({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, kind: 'journal', title: `Lectio: ${formatRef(ref)}`, body: reflection, refs: [refId(ref)], createdAt: Date.now(), updatedAt: Date.now() });
    setSaved(true);
  };
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Lectio Divina</h1>
      {step < 0 && (
        <>
          <p className="lede">An ancient way of praying with Scripture in four movements.</p>
          <div className="row" style={{ marginBottom: 8 }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && choose()} aria-label="Passage" style={{ flex: 1 }} />
            <button className="btn" onClick={choose}>Use</button>
          </div>
          {err && <div className="notice">{err}</div>}
          <label className="row between" style={{ margin: '10px 0' }}>
            <span>Length: {minutes} minutes</span>
            <input type="range" min={4} max={60} step={1} value={minutes} onChange={(e) => { setMinutes(+e.target.value); set({ lectioMinutes: +e.target.value }); }} />
          </label>
          {ref && (
            <div className="card" lang={ed.language} style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--read-size)', lineHeight: 'var(--read-lh)' as any }}>
              <div className="muted small" style={{ fontFamily: 'var(--font-sans)' }}>{formatRef(ref)} · {ed.shortName}</div>
              {text.map((t) => <span key={t.v}><sup>{t.v}</sup> {t.text} </span>)}
            </div>
          )}
          {earlier.length > 0 && (
            <div className="card" role="note">
              <strong>You have prayed with this passage before.</strong>
              <ul className="list">{earlier.map((j) => <li key={j.id}><span className="muted small">{new Date(j.createdAt).toLocaleDateString()}:</span> {j.body.slice(0, 220)}{j.body.length > 220 ? '…' : ''}</li>)}</ul>
              <p className="muted small" style={{ margin: 0 }}>What do you notice now? Your reflection today will be saved beside the earlier ones.</p>
            </div>
          )}
          <div className="row">
            <button className="btn primary" disabled={!ref} onClick={() => setStep(0)}>Begin</button>
            <button className="btn" onClick={speak}>Listen (device voice)</button>
          </div>
          <p className="muted small">“Listen” uses your device’s text-to-speech on the public-domain text. Recorded audio Scripture is not bundled (rights and hosting would have to be arranged per edition).</p>
        </>
      )}
      {step >= 0 && step <= 3 && (
        <div>
          <div className="chips" style={{ marginBottom: 12 }}>{STEPS.map((x, i) => <span key={x.key} className={`chip${i === step ? ' sel' : ''}`}>{x.name.split(' — ')[0]}</span>)}</div>
          <h2>{STEPS[step].name}</h2>
          <p className="lede">{STEPS[step].prompt}</p>
          {step <= 1 && ref && (
            <div className="card" lang={ed.language} style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--read-size)', lineHeight: 'var(--read-lh)' as any }}>
              {text.map((t) => <span key={t.v}><sup>{t.v}</sup> {t.text} </span>)}
            </div>
          )}
          {step >= 1 && <textarea placeholder="Notes for yourself (optional, private)" value={reflection} onChange={(e) => setReflection(e.target.value)} aria-label="Reflection" />}
          {step === 2 && (
            <details className="small"><summary>Traditional prayers</summary>{PRAYERS.slice(0, 4).map((p) => <p key={p.id}><strong>{p.title}.</strong> {p.text}</p>)}</details>
          )}
          <div className="row between" style={{ marginTop: 12 }}>
            <span className="muted">{fmt(left)}</span>
            <div className="row">
              {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
              <button className="btn primary" onClick={() => setStep(step + 1)}>{step === 3 ? 'Finish' : 'Next'}</button>
              <button className="btn ghost" onClick={() => setStep(-1)}>End</button>
            </div>
          </div>
        </div>
      )}
      {step === 4 && (
        <div>
          <h2>Amen.</h2>
          <p className="lede">Would you like to keep a note of this time of prayer?</p>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} aria-label="Reflection" />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" disabled={saved || !reflection.trim()} onClick={saveToJournal}>{saved ? 'Saved to journal' : 'Save to journal'}</button>
            <button className="btn" onClick={() => { setStep(-1); setSaved(false); setReflection(''); }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
