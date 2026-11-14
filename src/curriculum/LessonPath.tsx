import { lookupTerm } from '../data/glossary';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import LessonPlay from './LessonPlay';
import { worthDefining } from './terms';
import { activityName } from './LessonSlides';
import type { GradeData, Glossary, LessonSpec } from './model';
import type { Band } from './pedagogy';
import { cccList } from './model';
import { contentPoints } from './teachpoints';
import { saveLessonProgress, clearLessonProgress } from './resume';
import RelatedSources from './RelatedSources';
import { TrackLinks, RelatedInApp } from './LessonLinks';
import { WatchListen, DebateIt } from './LessonMedia';
import type { Extras } from './extras';

type Lesson = LessonSpec & { unit: GradeData['units'][number] };
interface Src { art?: { id: string; file: string; title: string; artist: string }[]; passages: { label: string; path: string; verses: { c: number; v: number; text: string }[] }[]; refIds: string[]; ccc: { n: number; t: string }[]; prayer?: { title: string; text: string } | null; story?: { id: string; title: string } | null }
interface Props {
  grade: GradeData; lesson: Lesson; index: number; band: Band; gl: Glossary; src: Src; kidsText: string;
  note: string; onNote: (v: string) => void; quiz: ReactNode; quick?: ReactNode; done: boolean; onDone: () => void; next?: { id: string; title: string };
  /** curated media and debate material for this lesson, and the big question it answers, when it has them */
  extras?: Extras | null; question?: string;
  /** a short review of earlier lessons, shown first */
  warmup?: ReactNode;
}
interface StepDef { id: string; label: string; icon: string; body: ReactNode }

/** The first two sentences of a longer passage, with the rest behind a button. */
function Excerpt({ text, n, more }: { text: string; n: number; more?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const parts = text.match(/[^.!?]+[.!?]+(?:["”’)\]]+)?\s*/g) ?? [text];
  const short = parts.slice(0, 2).join('').trim();
  const longer = parts.length > 2;
  return (
    <blockquote className="cur-ccc lp-ccc">
      <p>{open || !longer ? text : short + ' …'}</p>
      <footer>
        <Link to={`/study/catechism/${n}`}>Catechism §{n}</Link>
        {longer && <button type="button" className="linklike" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Show less' : 'Read all'}</button>}
        {more}
      </footer>
    </blockquote>
  );
}

function Passage({ p, studyId, adultish }: { p: Src['passages'][number]; studyId?: string; adultish: boolean }) {
  const [all, setAll] = useState(false);
  const cut = 8;
  const verses = all ? p.verses : p.verses.slice(0, cut);
  return (
    <blockquote className="cur-scripture">
      <p>{verses.map((v) => <span key={`${v.c}:${v.v}`}><sup>{v.v}</sup>{v.text} </span>)}</p>
      {p.verses.length > cut && <button type="button" className="btn small" onClick={() => setAll(!all)}>{all ? 'Show less' : `Keep reading (${p.verses.length - cut} more verses)`}</button>}
      <footer>{p.label} · <Link to={p.path}>Read it in the Bible</Link>{adultish && studyId && <> · <Link to={`/study/passage/${studyId}`}>Study this passage</Link></>}</footer>
    </blockquote>
  );
}

/** A lesson as a short journey with one part on screen at a time, so it reads as a lesson and not as a pile of sections. */
export default function LessonPath(p: Props) {
  const { lesson, band, gl, src } = p;
  const key = `sb:cur:step:${lesson.id}`;
  const [step, setStep] = useState(() => { try { return Math.max(0, +(sessionStorage.getItem(key) ?? 0)); } catch { return 0; } });
  const younger = band.id === 'primary' || band.id === 'elementary';
  const adultish = band.id === 'high' || band.id === 'adult';
  const words = useMemo(() => worthDefining(lesson.vocab.filter((v) => gl[v]), band), [lesson.id, gl, band.id]);
  const cccNums = cccList(lesson.ccc);
  const hookOk = !!lesson.hook && !/^(ask|have|invite|show|tell|write|put|hold|pass|divide|read|play|give|begin|start|open|display|post|lead|let|take|gather)\b/i.test(lesson.hook.trim());
  const cccCap = band.id === 'adult' ? 4 : band.id === 'high' ? 3 : band.id === 'middle' ? 2 : 1;

  const termsBlock = words.length > 0 && (
    <details className="lp-terms">
      <summary>{younger ? 'New words' : `Worth knowing: ${words.map((v) => gl[v].w).join(', ')}`}</summary>
      <dl className="cur-words">{words.map((v) => <div key={v}><dt>{(() => { const g = lookupTerm(gl[v].w); return g ? <Link to={`/study/glossary?t=${encodeURIComponent(g.term)}`}>{gl[v].w}</Link> : gl[v].w; })()}</dt><dd>{gl[v].d}</dd></div>)}</dl>
    </details>
  );
  const scriptureBlock = (
    <>
      {src.passages.map((x, i) => <Passage key={x.label} p={x} studyId={src.refIds[i]} adultish={adultish} />)}
      {!src.passages.length && <p className="muted small">Loading the passage… {lesson.scripture}</p>}
    </>
  );
  const storyBlock = lesson.saint && (
    <div className="lp-saint">
      <h3>{lesson.saint.split(':')[0]}</h3>
      {lesson.saintStory ? lesson.saintStory.split(/\n+/).map((t) => <p key={t}>{t}</p>) : <p>{lesson.saint.includes(':') ? lesson.saint.slice(lesson.saint.indexOf(':') + 1).trim() : ''}</p>}
    </div>
  );
  const talkBlock = (
    <>
      <p className="cur-idea">{lesson.question}</p>
      {lesson.talk && lesson.talk.length > 0 && <ul className="lp-talk">{lesson.talk.map((t) => <li key={t}>{t}</li>)}</ul>}
      <label className="small no-print">{younger ? 'Draw or write something (kept on this device)' : 'Your thoughts (kept on this device)'}
        <textarea data-no-dirty value={p.note} onChange={(e) => p.onNote(e.target.value)} rows={3} style={{ width: '100%' }} />
      </label>
    </>
  );
  const doBlock = (
    <>
      {lesson.tryit?.length ? <><p><strong>{activityName(lesson.activity)}</strong></p><ol>{lesson.tryit.map((t) => <li key={t}>{t}</li>)}</ol></> : <p>{lesson.activity}</p>}
      {lesson.life && <div className="lp-life"><h3>This week</h3><p>{lesson.life}</p></div>}
    </>
  );
  const memBlock = lesson.mem && <div className="cur-mem lp-mem"><h3>Learn by heart</h3><p>{lesson.mem}</p></div>;
  const gamesBlock = <LessonPlay grade={p.grade} lesson={lesson} index={p.index} gl={gl} />;
  const prayBlock = src.prayer && (
    <div className="lp-pray"><h3>{src.prayer.title}</h3><p style={{ whiteSpace: 'pre-line' }}>{src.prayer.text}</p></div>
  );
  const pic = (i: number) => { const w = src.art?.[i]; return w ? (
    <figure className="lp-figure"><img src={import.meta.env.BASE_URL + w.file} alt={w.title} loading="lazy" /><figcaption className="small muted">{i === 0 && lesson.visual?.caption ? lesson.visual.caption : w.title}, {w.artist}{(w as { credit?: string }).credit ? ` (${(w as { credit?: string }).credit})` : ''}</figcaption></figure>
  ) : null; };
  const picture = pic(0);
  const warm = p.warmup && <details className="lp-warm"><summary>Warm-up: what do you remember?</summary>{p.warmup}</details>;
  const hasMedia = !!p.extras && (p.extras.watch.length > 0 || p.extras.read.length > 0);
  const checkBlock = <div className="lp-check">{p.quiz}</div>;
  const deeper = (
    <details className="lp-deeper">
      <summary>Go deeper</summary>
      <ul>
        <li><Link to={`/study/catechism/${cccNums[0]}`}>The Catechism at §{cccNums[0]}</Link></li>
        {(lesson.deeper ?? []).map((d) => { const [k, id] = d.split(':'); return k === 'apol' ? <li key={d}><Link to={`/study/apologetics/${id}`}>Questions about the faith: {id.replace(/-/g, ' ')}</Link></li> : <li key={d}><Link to={`/room/work/${id}/0`}>Read: {id.replace(/-/g, ' ')}</Link></li>; })}
        {!younger && <li><Link to="/study/ask-fathers">Ask the Fathers about this</Link></li>}
        {(band.id === 'middle' || band.id === 'high' || band.id === 'adult') && <RelatedSources ccc={cccNums} />}
      </ul>
      {!younger && <TrackLinks lessonId={lesson.id} topics={(lesson.deeper ?? []).filter((d) => d.startsWith('apol:')).map((d) => d.slice(5))} />}
      {!younger && <RelatedInApp refId={src.refIds[0]} />}
    </details>
  );

  const steps: StepDef[] = useMemo(() => {
    const big = (
      <section className="cur-big" aria-label="The big idea"><h2 className="eyebrow-h">The big idea</h2><p className="cur-idea">{lesson.idea}</p><p className="muted small"><strong>Essential question:</strong> {lesson.unit.eq}</p></section>
    );
    const points = contentPoints(lesson);
    const teachPoints = lesson.explain && lesson.explain.length > 0
      ? <div className="lp-explain">{lesson.explain.map((t) => <p key={t}>{t}</p>)}</div>
      : points.length > 0 ? <ol className="lp-points">{points.map((t) => <li key={t}>{t}</li>)}</ol> : null;
    const objectives = lesson.objectives && lesson.objectives.length > 0 && (
      <details className="lp-objectives"><summary>What you will be able to do</summary><ul>{lesson.objectives.map((t) => <li key={t}>{t}</li>)}</ul></details>
    );
    const remember = lesson.remember && lesson.remember.length > 0 && (
      <div className="lp-remember"><h3>Remember</h3><ul>{lesson.remember.map((t) => <li key={t}>{t}</li>)}</ul></div>
    );
    const leaderSay = lesson.script && (
      <div className="lp-leader"><h3>A grown-up says it like this</h3>{[lesson.script.open, ...lesson.script.teach].filter(Boolean).map((t) => <p key={t}>{t}</p>)}</div>
    );
    const cccAll = src.ccc.slice(0, cccCap).map((c) => <Excerpt key={c.n} n={c.n} text={c.t} />);
    // one passage of the Catechism up front, the rest one tap away (labelled, not hidden)
    const ccc = cccAll.length > 2 ? <>{cccAll.slice(0, 1)}<details className="lp-deeper"><summary>{cccAll.length - 1} more from the Catechism</summary>{cccAll.slice(1)}</details></> : cccAll;
    const myths = lesson.misc && lesson.misc.length > 0 && (
      <div className="lp-myths"><h3>Things people often get wrong</h3><ul>{lesson.misc.map((t) => <li key={t}>{t}</li>)}</ul></div>
    );
    if (band.id === 'primary') return [
      { id: 'story', label: 'Story', icon: '📖', body: <>{picture}{p.kidsText ? <p className="cur-story">{p.kidsText}</p> : <p className="cur-idea">{lesson.idea}</p>}{leaderSay}{src.story && <p className="muted small">Retold from <Link to={`/study/kids/${src.story.id}`}>{src.story.title}</Link></p>}{termsBlock}</> },
      { id: 'wonder', label: 'Wonder', icon: '💭', body: <>{hookOk && <p className="lp-hook">{lesson.hook}</p>}{pic(1)}{talkBlock}</> },
      { id: 'play', label: 'Play', icon: '🎲', body: gamesBlock },
      { id: 'do', label: 'Do', icon: '✂️', body: <>{doBlock}{memBlock}</> },
      { id: 'pray', label: 'Pray', icon: '🙏', body: <>{pic(2)}{prayBlock}<details className="lp-deeper"><summary>For grown-ups: the Catechism</summary>{src.ccc.slice(0, 2).map((c) => <Excerpt key={c.n} n={c.n} text={c.t} />)}</details></> },
      { id: 'check', label: 'Check', icon: '⭐', body: checkBlock },
    ];
    if (band.id === 'elementary') return [
      { id: 'listen', label: 'Listen', icon: '📖', body: <>{warm}{picture}{big}{p.kidsText && <p className="cur-story">{p.kidsText}</p>}{scriptureBlock}</> },
      { id: 'learn', label: 'Learn', icon: '💡', body: <>{objectives}{teachPoints}{termsBlock}{ccc}{remember}{memBlock}{storyBlock}{p.quick}</> },
      { id: 'play', label: 'Play', icon: '🎲', body: gamesBlock },
      { id: 'talk', label: 'Talk', icon: '💬', body: <>{pic(1)}{talkBlock}</> },
      { id: 'do', label: 'Do', icon: '✂️', body: doBlock },
      { id: 'pray', label: 'Pray', icon: '🙏', body: <>{pic(2)}{prayBlock}</> },
      { id: 'check', label: 'Check', icon: '⭐', body: <>{checkBlock}{deeper}</> },
    ];
    return [
      { id: 'begin', label: 'Begin', icon: '🌅', body: <>{warm}{hookOk && <p className="lp-hook">{lesson.hook}</p>}{picture}{big}<h3 className="lp-ask">Start with this</h3><p className="cur-idea">{lesson.question}</p>{objectives}</> },
      { id: 'scripture', label: 'Scripture', icon: '📖', body: <>{pic(1)}<p className="muted small">Read it slowly, and notice the one phrase that stays with you.</p>{scriptureBlock}</> },
      { id: 'teaching', label: 'Teaching', icon: '🕊️', body: <>{teachPoints ?? <p>{lesson.idea}</p>}{termsBlock}<h3 className="lp-ask">In the Catechism’s own words</h3>{ccc}{cccNums.length > cccCap && <p className="small"><Link to={`/study/catechism/${cccNums[0]}`}>More in the Catechism</Link></p>}{remember}{p.quick && <><h3 className="lp-ask">Quick check</h3>{p.quick}</>}</> },
      { id: 'witness', label: 'Witness', icon: '⭐', body: <>{pic(2)}{storyBlock}{myths}{memBlock}</> },
      ...(hasMedia ? [{ id: 'watch', label: 'Watch and listen', icon: '🎬', body: <WatchListen extras={p.extras!} /> }] : []),
      { id: 'discuss', label: 'Discuss', icon: '💬', body: <>{talkBlock}{p.extras && (p.extras.debate.length > 0 || p.question) && <DebateIt extras={p.extras} question={p.question} />}</> },
      { id: 'practice', label: 'Practice', icon: '🎯', body: <>{doBlock}{adultish ? <details className="lp-deeper"><summary>Optional: practise with games</summary>{gamesBlock}</details> : gamesBlock}</> },
      { id: 'close', label: 'Pray and check', icon: '🙏', body: <>{pic(3)}{prayBlock}<h3 className="lp-ask">Check what you took in</h3>{checkBlock}{deeper}</> },
    ].filter((s) => s.id !== 'witness' || lesson.saint || (lesson.misc && lesson.misc.length) || lesson.mem);
  }, [lesson.id, band.id, gl, src.passages.length, src.ccc.length, src.art?.length, p.extras, p.warmup, p.kidsText, p.note, p.quiz, p.quick, src.prayer?.title]);

  const last = steps.length - 1;
  const recap = useMemo(() => (lesson.remember && lesson.remember.length ? lesson.remember : contentPoints(lesson)).slice(0, 3), [lesson.id]);
  const at = Math.min(step, last);
  useEffect(() => { try { sessionStorage.setItem(key, String(at)); } catch { /* private mode */ } }, [at, key]);
  useEffect(() => { if (at >= last) clearLessonProgress(p.grade.id, lesson.id); else if (at > 0) saveLessonProgress({ grade: p.grade.id, lesson: lesson.id, title: lesson.title, step: at, steps: steps.length }); }, [at, last, p.grade.id, lesson.id]);
  const go = (i: number) => { setStep(Math.max(0, Math.min(last, i))); requestAnimationFrame(() => document.getElementById('lp-top')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); };
  const cur = steps[at];

  return (
    <section className="lp" aria-label="Lesson">
      <div id="lp-top" className="lp-head">
        <ol className="lp-steps" aria-label="Lesson steps">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={`lp-dot${i === at ? ' on' : ''}${i < at ? ' past' : ''}`} aria-current={i === at ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.label}`} onClick={() => go(i)}>
                <span className="lp-n" aria-hidden="true">{i < at ? '✓' : s.icon}</span>
                <span className="lp-l">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="lp-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={at + 1} aria-label="Lesson progress"><i style={{ width: `${((at + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <article className="lp-card" key={cur.id}>
        <h2 className="lp-title"><span aria-hidden="true">{cur.icon}</span> {cur.label}<small> · step {at + 1} of {steps.length}</small></h2>
        {cur.body}
      </article>
      {at === last && (
        <aside className="lp-finish" aria-label="Lesson recap">
          <h3>{p.done ? '🎉 Lesson complete' : 'Before you go'}</h3>
          {recap.length > 0 && <><p className="small muted">Three things to carry out of this lesson:</p><ol>{recap.map((t) => <li key={t}>{t}</li>)}</ol></>}
          {lesson.mem && <p className="small"><strong>Learn by heart:</strong> {lesson.mem}</p>}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`btn${p.done ? '' : ' primary'}`} aria-pressed={p.done} onClick={() => { if (!p.done) p.onDone(); }}>{p.done ? '✓ Marked done' : 'Mark this lesson done'}</button>
            {p.next && <Link className="btn primary" to={`/study/curriculum/${p.grade.id}/${p.next.id}`}>Next lesson: {p.next.title} →</Link>}
          </div>
        </aside>
      )}
      <div className="lp-nav no-print">
        <button type="button" className="btn" onClick={() => go(at - 1)} disabled={at === 0}>← Back</button>
        {at < last
          ? <button type="button" className="btn primary" onClick={() => go(at + 1)}>Next: {steps[at + 1].label} →</button>
          : <span />}
      </div>
    </section>
  );
}
