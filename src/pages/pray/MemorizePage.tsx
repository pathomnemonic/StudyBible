import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MemoryCard } from '../../db/db';
import { useSettings } from '../../lib/store';
import { useEditions } from '../../data/EditionsContext';
import { getJson } from '../../data/loader';
import { passageText } from '../../lib/bibleText';
import { formatRef, parseRefId, refId } from '../../lib/refs';
import { refsFromText } from '../../study/refData';
import { clozeIndexes, DAY, isDue, newCard, normalize, schedule } from '../../lib/srs';
import { useToast } from '../../components/Toast';
import Icon from '../../components/Icon';
import RefLink from '../../components/RefLink';

type Mode = 'recall' | 'cloze' | 'initials' | 'audio' | 'order';
const MODES: [Mode, string, string][] = [
  ['recall', 'Recall', 'See the reference, say the verse, then check.'],
  ['cloze', 'Fill in the blanks', 'Type the missing words; more are hidden as you improve.'],
  ['initials', 'First letters', 'Only the first letter of each word is shown.'],
  ['order', 'Put in order', 'The verse is cut into pieces and shuffled; tap them in the right order.'],
  ['audio', 'Audio recall', 'Hear the reference and the opening words, then continue from memory.'],
];

interface SetDef {
  id: string;
  title: string;
  refs: string[];
}

/** Scripture memorization with spaced repetition, themed sets, fill-in-the-blank, and audio recall. */
export default function MemorizePage() {
  const cards = useLiveQuery(() => db.memory.toArray(), []) ?? [];
  const [sets, setSets] = useState<SetDef[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [mode, setMode] = useState<Mode>('recall');
  const [text, setText] = useState('');
  const toast = useToast();
  useEffect(() => {
    getJson<{ sets: SetDef[] }>('reference/memory-sets.json', true).then((d) => setSets(d?.sets ?? []));
  }, []);
  const now = Date.now();
  const due = cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
  const have = new Set(cards.map((c) => c.ref));

  const addRefs = async (texts: string[], set?: string) => {
    let n = 0;
    for (const t of texts) {
      for (const r of refsFromText(t)) {
        const id = refId(r);
        if (have.has(id)) continue;
        have.add(id);
        await db.memory.add({ ref: id, set, ...newCard(), createdAt: Date.now() });
        n++;
      }
    }
    toast(n ? `Added ${n} verse${n === 1 ? '' : 's'} to memorize.` : 'Already in your list (or not a valid reference).', n ? 'info' : 'error');
  };

  if (reviewing && due.length) return <Review cards={due} mode={mode} onDone={() => setReviewing(false)} />;

  const streakDays = new Set(cards.filter((c) => c.lastReviewed).map((c) => new Date(c.lastReviewed!).toLocaleDateString('en-CA')));
  const reviewedToday = streakDays.has(new Date().toLocaleDateString('en-CA'));
  const known = cards.filter((c) => c.interval >= 21).length;
  return (
    <div className="page">
      <h1>Memorize Scripture</h1>
      <p className="lede">Spaced repetition: verses you know well come back less often; the ones you miss come back soon.</p>
      <div className="card">
        <div className="row between">
          <div>
            <strong>{due.length}</strong> due now · {cards.length} in your list · {known} well known{reviewedToday ? ' · reviewed today' : ''}
          </div>
          <button className="btn primary" disabled={!due.length} onClick={() => setReviewing(true)}>
            <Icon name="play" size={14} /> Review {due.length ? `(${due.length})` : ''}
          </button>
        </div>
        <div className="segmented" role="tablist" style={{ marginTop: 10, flexWrap: 'wrap' }} aria-label="Review style">
          {MODES.map(([m, label]) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} title={MODES.find((x) => x[0] === m)![2]}>{label}</button>
          ))}
        </div>
        <p className="muted small" style={{ margin: '6px 0 0' }}>{MODES.find((x) => x[0] === mode)![2]}</p>
      </div>

      <div className="card">
        <h2 className="card-title">Add a verse</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addRefs([text]); setText(''); } }}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Philippians 4:13 or John 3:16-17" aria-label="Reference to memorize" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn primary" type="submit">Add</button>
        </form>
        <p className="muted small">Tip: in the reader, select a passage and add it to your list from here by typing its reference. Short passages (1–3 verses) work best.</p>
      </div>

      <h2 style={{ fontSize: '1.15rem' }}>Themed sets</h2>
      <div className="grid">
        {sets.map((s) => {
          const added = s.refs.every((r) => refsFromText(r).every((x) => have.has(refId(x))));
          return (
            <div className="card" key={s.id}>
              <h3>{s.title}</h3>
              <p className="muted small">{s.refs.join(' · ')}</p>
              <button className="btn small" disabled={added} onClick={() => addRefs(s.refs, s.id)}>{added ? 'In your list' : 'Add set'}</button>
            </div>
          );
        })}
      </div>

      {cards.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.15rem', marginTop: 20 }}>Your verses</h2>
          <ul className="list">
            {[...cards].sort((a, b) => a.due - b.due).map((c) => {
              const r = parseRefId(c.ref);
              return (
                <li key={c.id}>
                  <div className="row between">
                    <span><RefLink id={c.ref}>{r ? formatRef(r) : c.ref}</RefLink> <span className="muted small">{isDue(c) ? 'due now' : `next in ${Math.max(1, Math.round((c.due - now) / DAY))} day${Math.round((c.due - now) / DAY) === 1 ? '' : 's'}`}{c.reps ? ` · ${c.reps} in a row` : ''}</span></span>
                    <button className="btn small ghost" onClick={() => db.memory.delete(c.id!)} aria-label={`Remove ${r ? formatRef(r) : c.ref}`}>Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Review({ cards, mode, onDone }: { cards: MemoryCard[]; mode: Mode; onDone: () => void }) {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition) ?? editions[0];
  const [queue, setQueue] = useState(cards.map((c) => c.id!));
  const cur = cards.find((c) => c.id === queue[0]);
  const [verseText, setVerseText] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(0);
  useEffect(() => {
    setRevealed(false);
    setAnswers([]);
    setVerseText(null);
    const r = cur && parseRefId(cur.ref);
    if (r) passageText(ed, r, 8).then((vs) => setVerseText(vs.map((v) => v.text).join(' ')));
  }, [cur?.id, ed.id]);

  const words = useMemo(() => (verseText ? verseText.split(/\s+/) : []), [verseText]);
  const blanks = useMemo(() => (cur ? clozeIndexes(words, cur.reps) : new Set<number>()), [words, cur?.reps]);
  // "put in order": cut the verse at its punctuation (or into short runs of words), shuffle with a fixed seed so a re-render does not reshuffle
  const chunks = useMemo(() => {
    if (!verseText) return [] as string[];
    let parts = verseText.split(/(?<=[,;:.!?—])\s+/).filter(Boolean);
    if (parts.length < 3) { parts = []; const w = verseText.split(/\s+/); for (let i = 0; i < w.length; i += 3) parts.push(w.slice(i, i + 3).join(' ')); }
    return parts;
  }, [verseText]);
  const shuffled = useMemo(() => {
    const idx = chunks.map((_, i) => i);
    let seed = (cur?.id ?? 1) * 9301 + 49297;
    for (let i = idx.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor((seed / 233280) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [chunks, cur?.id]);
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => setPicked([]), [cur?.id]);
  const orderRight = picked.length === chunks.length && picked.every((x, i) => x === i);
  const speak = (t: string) => {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.rate = s.ttsRate;
    speechSynthesis.speak(u);
  };

  const grade = async (g: 0 | 1 | 2 | 3) => {
    if (!cur) return;
    const next = schedule(cur, g);
    await db.memory.update(cur.id!, { ...next, lastReviewed: Date.now() });
    setDone((d) => d + 1);
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
  };

  if (!cur)
    return (
      <div className="page">
        <h1>Well done</h1>
        <p className="lede">You reviewed {done} card{done === 1 ? '' : 's'}. Come back when more are due.</p>
        <button className="btn primary" onClick={onDone}>Back to my verses</button>
      </div>
    );
  const r = parseRefId(cur.ref)!;
  const label = formatRef(r);

  // fill-in-the-blank scoring
  const blankList = [...blanks].sort((a, b) => a - b);
  const correct = blankList.filter((idx, k) => normalize(answers[k] ?? '') === normalize(words[idx]));
  const allRight = blankList.length > 0 && correct.length === blankList.length;

  return (
    <div className="page">
      <div className="row between">
        <h1 style={{ margin: 0 }}>{label}</h1>
        <button className="btn small ghost" onClick={onDone}>End session</button>
      </div>
      <p className="muted small">{queue.length} left · {ed.shortName}</p>
      <div className="card" style={{ minHeight: 160 }}>
        {!verseText && <p className="muted">Loading…</p>}
        {verseText && mode === 'recall' && (revealed ? <p className="verse-card">{verseText}</p> : <p className="muted">Say the verse from memory, then reveal it.</p>)}
        {verseText && mode === 'initials' && <p className="verse-card" aria-label="First letters of each word">{revealed ? verseText : words.map((w) => w[0] + '·'.repeat(Math.min(2, Math.max(0, w.length - 1)))).join(' ')}</p>}
        {verseText && mode === 'cloze' && (
          <p className="verse-card cloze">
            {words.map((w, i) => {
              if (!blanks.has(i)) return <span key={i}>{w} </span>;
              const k = blankList.indexOf(i);
              const ok = revealed ? normalize(answers[k] ?? '') === normalize(w) : null;
              return (
                <span key={i}>
                  <input className={`blank${ok === true ? ' ok' : ok === false ? ' bad' : ''}`} value={answers[k] ?? ''} disabled={revealed} onChange={(e) => setAnswers((a) => { const n = [...a]; n[k] = e.target.value; return n; })} size={Math.max(3, w.length)} aria-label={`Blank ${k + 1} of ${blankList.length}`} autoCapitalize="off" autoComplete="off" spellCheck={false} />
                  {revealed && ok === false && <b className="ans"> ({w})</b>}{' '}
                </span>
              );
            })}
          </p>
        )}
        {verseText && mode === 'order' && (
          <div>
            <p className="verse-card" aria-live="polite">{picked.length ? picked.map((i) => chunks[i]).join(' ') : <span className="muted">Tap the pieces in order.</span>}</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {shuffled.filter((i) => !picked.includes(i)).map((i) => <button key={i} className="btn small" disabled={revealed} onClick={() => setPicked([...picked, i])}>{chunks[i]}</button>)}
            </div>
            {picked.length > 0 && !revealed && <button className="btn small ghost" onClick={() => setPicked(picked.slice(0, -1))}>Undo last</button>}
            {revealed && <p aria-live="polite"><strong>{orderRight ? 'In order ✓' : 'Not quite:'}</strong> {!orderRight && verseText}</p>}
          </div>
        )}
        {verseText && mode === 'audio' && (
          <>
            <p className="muted">Listen, then continue the verse aloud from memory.</p>
            <button className="btn" onClick={() => speak(`${label}. ${words.slice(0, 4).join(' ')}`)}><Icon name="listen" size={14} /> Hear the start</button>{' '}
            {revealed && (
              <>
                <p className="verse-card">{verseText}</p>
                <button className="btn small" onClick={() => speak(verseText)}><Icon name="play" size={14} /> Hear it read</button>
              </>
            )}
          </>
        )}
      </div>
      {!revealed ? (
        <button className="btn primary" disabled={!verseText || (mode === 'order' && picked.length < chunks.length)} onClick={() => setRevealed(true)}>{mode === 'cloze' || mode === 'order' ? 'Check' : 'Reveal'}</button>
      ) : (
        <div>
          {mode === 'cloze' && <p aria-live="polite"><strong>{correct.length}</strong> of {blankList.length} right.{allRight ? ' ✓' : ''}</p>}
          <div className="row" role="group" aria-label="How well did you know it?">
            <button className="btn" onClick={() => grade(0)}>Again <span className="muted small">10 min</span></button>
            <button className="btn" onClick={() => grade(1)}>Hard</button>
            <button className="btn primary" onClick={() => grade(mode === 'order' ? (orderRight ? 2 : 1) : allRight || mode !== 'cloze' ? 2 : 1)}>Good</button>
            <button className="btn" onClick={() => grade(3)}>Easy</button>
          </div>
        </div>
      )}
    </div>
  );
}
