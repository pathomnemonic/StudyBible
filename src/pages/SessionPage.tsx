import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { passageText } from '../lib/bibleText';
import { formatRef, parseRefs, refId, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { readingsFor } from '../liturgy/readings';
import { providers, type StudyItem } from '../study/providers';
import { verseForDay } from '../study/verseOfDay';
import { readerPath } from '../lib/nav';
import { useToast } from '../components/Toast';
import ReadAloud from '../components/ReadAloud';

const STEPS = ['Open', 'Read', 'Reflect', 'Hear the Church', 'Pray'] as const;
const localIso = () => new Date().toLocaleDateString('en-CA');

/** A short, finishable guided session: open in prayer, read, reflect, hear what the Church has said, pray. Uses only what the app already holds. */
export default function SessionPage() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const toast = useToast();
  const ed = get(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition) ?? editions[0];
  const [step, setStep] = useState(0);
  const [ref, setRef] = useState<Ref | null>(null);
  const [source, setSource] = useState('');
  const [verses, setVerses] = useState<{ n: number; text: string }[]>([]);
  const [open, setOpen] = useState('');
  const [ourFather, setOurFather] = useState('');
  const [church, setChurch] = useState<StudyItem[]>([]);
  const [note, setNote] = useState('');
  const [aloud, setAloud] = useState(false);

  // choose the passage: today's Gospel if the calendar service has it, otherwise the verse of the day
  useEffect(() => {
    (async () => {
      let r: Ref | null = null;
      let src = '';
      try {
        const rd = await readingsFor(s.diocese, localIso());
        const g = rd.items.find((i) => i.slot === 'gospel');
        if (g?.refs[0]) {
          r = g.refs[0];
          src = `Today’s Gospel (${g.text})`;
        }
      } catch {
        /* offline */
      }
      if (!r) {
        const p = parseRefs(verseForDay());
        if (p.ok) {
          r = convertRef('kjv', 'vulgate', p.refs[0].ref).ref;
          src = 'Verse of the day';
        }
      }
      setRef(r);
      setSource(src);
    })();
  }, [s.diocese]);

  useEffect(() => {
    if (!ref || !ed) return;
    passageText(ed, ref, 40).then((vs) => setVerses(vs.map((v) => ({ n: v.v, text: v.text }))));
    Promise.all([providers.commentary([ref]), providers.fathers([ref]), providers.catechism([ref])]).then(([c, f, k]) => setChurch([...c.slice(0, 2), ...f.slice(0, 1), ...k.slice(0, 1)]));
  }, [ref?.book, ref?.c1, ref?.v1, ed?.id]);
  useEffect(() => {
    if (!ed) return;
    const a = parseRefs('Psalm 119:18');
    const b = parseRefs('Matthew 6:9-13');
    if (a.ok) passageText(ed, convertRef('kjv', 'vulgate', a.refs[0].ref).ref, 2).then((v) => setOpen(v.map((x) => x.text).join(' ')));
    if (b.ok) passageText(ed, convertRef('kjv', 'vulgate', b.refs[0].ref).ref, 8).then((v) => setOurFather(v.map((x) => x.text).join(' ')));
  }, [ed?.id]);

  const save = async () => {
    if (!ref) return;
    await db.notes.add({ title: `Reflection: ${formatRef(ref, { noDual: true })}`, body: note.trim() || '(session without a written note)', kind: 'study', targets: [{ type: 'passage', ref: refId(ref) }], tags: ['session'], chapterKeys: [`${ref.book}.${ref.c1}`], originEdition: ed.id, createdAt: Date.now(), updatedAt: Date.now() });
    toast('Saved to your notes.');
  };

  if (!ref) return <div className="page"><p className="muted">Choosing today’s passage…</p></div>;
  return (
    <div className="page">
      <h1>Read with the Church</h1>
      <p className="muted small">{source} · {formatRef(ref, { noDual: true })} · {ed.shortName}</p>
      <ol className="steps" aria-label="Session steps">
        {STEPS.map((l, i) => <li key={l} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>{l}</li>)}
      </ol>
      <div className="card" style={{ minHeight: 200 }}>
        {step === 0 && (
          <>
            <h2 className="card-title">Open</h2>
            <p>Take a breath and ask for the Spirit’s help. Pray in your own words, or with the psalmist:</p>
            <blockquote className="verse-card">{open || '…'}</blockquote>
            <p className="muted small">Psalm 119:18 ({ed.shortName})</p>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="card-title">Read</h2>
            <p className="muted small">Read slowly, twice. What word or phrase stays with you?</p>
            <div className="verse-card">{verses.map((v) => <span key={v.n}><sup>{v.n}</sup> {v.text} </span>)}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn small" onClick={() => setAloud(!aloud)}>{aloud ? 'Stop reading aloud' : 'Read aloud'}</button>
              <Link className="btn small" to={readerPath(ed, ref)}>Open in the reader</Link>
            </div>
            {aloud && verses.length > 0 && <ReadAloud verses={verses} lang={ed.language} onVerse={() => {}} onClose={() => setAloud(false)} />}
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="card-title">Reflect</h2>
            <ul>
              <li>What does the text say? (Who, what, where?)</li>
              <li>What does it say about God?</li>
              <li>What is it saying to me, today?</li>
              <li>What will I do, or ask for, in response?</li>
            </ul>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="Write a line or two (optional). It will be saved as a note on this passage." aria-label="Your reflection" />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="card-title">Hear the Church</h2>
            <p className="muted small">What Catholic commentators and the Catechism have said about this passage (from the app’s sources). Read as a conversation partner, not a replacement for the text.</p>
            {church.length === 0 && <p className="muted">Nothing in the loaded sources is attached to this exact passage. Try the study panel in the reader for neighbouring verses.</p>}
            {church.map((i) => (
              <article key={i.id} className="item" data-auth={i.authority}>
                <div className="kicker"><span className="dot" /><span>{i.kind ?? i.sourceName}</span></div>
                <div className="t">{i.title}</div>
                {i.author && <div className="by">{i.author}</div>}
                {i.excerpt && <div className="ex clamp">{i.excerpt}</div>}
                <div className="acts">{i.url && <a className="btn small" href={i.url} target="_blank" rel="noreferrer">Original source ↗</a>}{i.internal && <Link className="btn small" to={i.internal}>Open</Link>}</div>
              </article>
            ))}
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="card-title">Pray</h2>
            <p>Respond to what you have heard, in your own words. Close with the prayer Jesus gave:</p>
            <blockquote className="verse-card">{ourFather || '…'}</blockquote>
            <p className="muted small">Matthew 6:9–13 ({ed.shortName})</p>
            <div className="row">
              <button className="btn primary" onClick={save}>Save my reflection</button>
              <Link className="btn" to="/today">Back to Today</Link>
            </div>
          </>
        )}
      </div>
      <div className="row between" style={{ marginTop: 10 }}>
        <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < STEPS.length - 1 && <button className="btn primary" onClick={() => setStep(step + 1)}>Next: {STEPS[step + 1]}</button>}
      </div>
    </div>
  );
}
