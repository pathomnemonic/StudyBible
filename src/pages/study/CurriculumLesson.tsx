import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useSettings } from '../../lib/store';
import { getGlossary, getGrade, flatLessons, gradeLabel, progressId, toggleDone, vocabQuiz, reviewTerms, cccList, parseQuiz, type GradeData, type Glossary, type LessonSpec, type Question } from '../../curriculum/model';
import { bandOf, FAMILY_DAYS, type Band } from '../../curriculum/pedagogy';
import { useLessonSources } from '../../curriculum/useLessonSources';
import InlinePlayer from '../../components/InlinePlayer';
import LessonSlides, { buildSlides } from '../../curriculum/LessonSlides';
import LessonPlay from '../../curriculum/LessonPlay';
import StartLive from '../../live/StartLive';
import { toLiveSlides } from '../../live/slides';
import { embedFor } from '../../lib/embed';

type Mode = 'student' | 'teacher' | 'family';
const MODES: [Mode, string, string][] = [['student', 'Student', 'Read, watch, do, check'], ['teacher', 'Teacher', 'Timed plan and background'], ['family', 'Family', 'A five-day plan for home']];

function Quiz({ qs, onDone }: { qs: Question[]; onDone?: (score: number) => void }) {
  const [pick, setPick] = useState<Record<number, number>>({});
  const answered = Object.keys(pick).length;
  const score = qs.filter((q, i) => pick[i] === q.answer).length;
  useEffect(() => { if (qs.length && answered === qs.length) onDone?.(score); }, [answered]);
  if (!qs.length) return <p className="muted small">No vocabulary questions for this lesson.</p>;
  return (
    <div>
      {qs.map((q, i) => (
        <fieldset key={i} className="cur-q">
          <legend>{i + 1}. {q.q}</legend>
          {q.options.map((o, j) => {
            const done = pick[i] !== undefined;
            const cls = done ? (j === q.answer ? ' right' : pick[i] === j ? ' wrong' : '') : '';
            return <button key={j} type="button" className={`cur-opt${cls}`} disabled={done} onClick={() => setPick({ ...pick, [i]: j })}>{o}</button>;
          })}
        </fieldset>
      ))}
      {Object.keys(pick).map((k) => qs[+k].why ? <p key={k} className="muted small">Question {+k + 1}: {qs[+k].why}</p> : null)}
      {answered === qs.length && <p role="status"><strong>{score} of {qs.length}.</strong> {score === qs.length ? 'Well done.' : 'Look again at the words above, then try the lesson’s question aloud.'}</p>}
    </div>
  );
}

function speak(parts: string[], onEnd: () => void) {
  try {
    speechSynthesis.cancel();
    parts.filter(Boolean).forEach((p, i, a) => { const u = new SpeechSynthesisUtterance(p); u.rate = 0.95; if (i === a.length - 1) u.onend = onEnd; speechSynthesis.speak(u); });
  } catch { onEnd(); }
}

const mins = (total: number, share: number) => Math.max(2, Math.round((total * share) / 1));

const pillarKey = (p: string) => (/creed|revel|faith|god|trinity|christ|church|mary|last/i.test(p) ? 'creed' : /sacrament|liturg|worship|mass|eucharist/i.test(p) ? 'sacrament' : /moral|life|commandment|virtue|beatitude|justice|vocation/i.test(p) ? 'moral' : /prayer|pray/i.test(p) ? 'prayer' : 'creed');
const pillarIcon = (p: string) => ({ creed: '✝', sacrament: '🕯', moral: '🧭', prayer: '🙏' })[pillarKey(p)];

export default function CurriculumLesson() {
  const { grade = '', lessonId = '' } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [st] = useSettings();
  const [g, setG] = useState<GradeData | null | undefined>(undefined);
  const [gl, setGl] = useState<Glossary>({});
  const [mode, setMode] = useState<Mode>(() => { try { const m = localStorage.getItem('sb:cur:mode'); return m === 'teacher' || m === 'family' ? m : 'student'; } catch { return 'student'; } });
  const [length, setLength] = useState(0);
  const [present, setPresent] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [liveOpen, setLiveOpen] = useState(false);
  useEffect(() => { getGrade(grade).then((x) => setG(x ?? null)); getGlossary().then(setGl); }, [grade]);
  const flat = useMemo(() => (g ? flatLessons(g) : []), [g]);
  const idx = flat.findIndex((l) => l.id === lessonId);
  const lesson = flat[idx] as (LessonSpec & { unit: GradeData['units'][number] }) | undefined;
  const band: Band | undefined = g ? bandOf(g.band) : undefined;
  const src = useLessonSources(lesson, g?.band);
  const prog = useLiveQuery(() => db.planProgress.get(progressId(grade)), [grade]);
  const done = prog?.done.includes(idx) ?? false;
  const setM = (m: Mode) => { setMode(m); try { localStorage.setItem('sb:cur:mode', m); } catch { /* private mode */ } };
  useEffect(() => { try { setNote(localStorage.getItem(`sb:cur:note:${lessonId}`) ?? ''); } catch { setNote(''); } setSpeaking(false); try { speechSynthesis.cancel(); } catch { /* none */ } }, [lessonId]);
  useEffect(() => () => { try { speechSynthesis.cancel(); } catch { /* none */ } }, []);
  useEffect(() => { if (sp.get('present') === '1') setPresent(true); }, []);

  const pool = useMemo(() => [...new Set(flat.flatMap((l) => l.vocab))], [flat]);
  const quiz = useMemo(() => (lesson?.quiz?.length ? lesson.quiz.map(parseQuiz) : lesson ? vocabQuiz(lesson, gl, pool, 3) : []), [lesson?.id, gl, pool.length]);
  const vocabOnly = useMemo(() => (lesson?.quiz?.length ? vocabQuiz(lesson, gl, pool, 2) : []), [lesson?.id, gl, pool.length]);
  const review = useMemo(() => (g && idx > 0 ? vocabQuiz({ ...lesson!, id: lesson!.id + 'r', vocab: reviewTerms(g, idx, 3) }, gl, pool, 3) : []), [lesson?.id, gl, idx]);

  if (g === undefined) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!g || !lesson || !band) return <div className="page"><Link to="/study/curriculum">← Curriculum</Link><p>That lesson was not found.</p></div>;

  const minutes = length || band.minutes;
  const words = lesson.vocab.filter((v) => gl[v]);
  const kidsText = src.story ? src.story.text[st.kidsAge] : '';
  const scriptureText = src.passages.map((p) => `${p.label}. ${p.verses.map((v) => v.text).join(' ')}`).join(' ');
  const cccNums = cccList(lesson.ccc);
  const prev = flat[idx - 1], next = flat[idx + 1];
  const primary = g.band === 'primary';
  const adult = g.band === 'adult';
  const modes = adult ? MODES.filter(([m]) => m !== 'family').map(([m, l, d]) => (m === 'student' ? [m, 'Participant', 'Read, pray, discuss, decide'] : m === 'teacher' ? [m, 'Leader', 'A timed plan for leading a group'] : [m, l, d]) as [Mode, string, string]) : MODES;
  const readAloud = () => {
    if (speaking) { try { speechSynthesis.cancel(); } catch { /* none */ } setSpeaking(false); return; }
    setSpeaking(true);
    speak([`${lesson.title}.`, lesson.idea, kidsText || scriptureText, `Think and talk. ${lesson.question}`], () => setSpeaking(false));
  };
  const slides = present ? buildSlides({ lesson, grade: g, gl, band, passages: src.passages, ccc: src.ccc, videos: src.videos, art: src.art, story: kidsText, prayer: src.prayer, quiz, base: import.meta.env.BASE_URL }) : [];

  const liveSlides = () => toLiveSlides(buildSlides({ lesson, grade: g, gl, band, passages: src.passages, ccc: src.ccc, videos: src.videos, art: src.art, story: kidsText, prayer: src.prayer, quiz, base: import.meta.env.BASE_URL }));
  return (
    <div className="page cur-lesson">
      <nav className="no-print row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 6 }} aria-label="Lesson navigation">
        <Link to={`/study/curriculum/${g.id}`} className="small">← {gradeLabel(g.id)}</Link>
        <span className="muted small">Unit {lesson.unit.n}: {lesson.unit.title}</span>
      </nav>
      <div className={`lesson-banner pillar-${pillarKey(lesson.unit.pillar)}`}><span className="pillar-ico" aria-hidden="true">{pillarIcon(lesson.unit.pillar)}</span><div><div className="pillar-name">{lesson.unit.pillar}</div><h1 style={{ margin: 0 }}>{lesson.title}</h1></div></div>
      <p className="muted small" style={{ marginTop: 0 }}>{gradeLabel(g.id)} · {g.theme} · Lesson {idx + 1} of {flat.length}</p>

      {liveOpen && <StartLive grade={g} lesson={lesson} slides={liveSlides()} onClose={() => setLiveOpen(false)} />}
      <div className="tabbar no-print" role="tablist" aria-label="View">
        {modes.map(([m, l, d]) => <button key={m} role="tab" aria-selected={mode === m || (adult && mode === 'family' && m === 'student')} title={d} onClick={() => setM(m)}>{l}</button>)}
      </div>
      <div className="row no-print" style={{ gap: 6, flexWrap: 'wrap', margin: '4px 0 10px' }}>
        <button className="btn small" onClick={() => setPresent(true)}>▶ Present as slides</button>
        <button className="btn small" onClick={() => setLiveOpen(true)}>📡 Host live with a class code</button>
        <Link className="btn small" to="/join">Join a class</Link>
        {typeof speechSynthesis !== 'undefined' && <button className="btn small" onClick={readAloud} aria-pressed={speaking}>{speaking ? '■ Stop' : '🔊 Read to me'}</button>}
        <button className="btn small" onClick={() => window.print()}>🖨 Print this lesson</button>
        <button className={`btn small${done ? ' primary' : ''}`} aria-pressed={done} onClick={() => toggleDone(g.id, idx, !done)}>{done ? '✓ Done' : 'Mark done'}</button>
      </div>

      <section className="cur-big" aria-label="The big idea">
        <h2 className="eyebrow-h">The big idea</h2>
        <p className="cur-idea">{lesson.idea}</p>
        <p className="muted small"><strong>Essential question:</strong> {lesson.unit.eq}</p>
      </section>

      {mode !== 'teacher' && <LessonPlay grade={g} lesson={lesson} index={idx} gl={gl} />}

      {mode !== 'teacher' && lesson.hook && <section className="cur-hook" aria-label="Start here"><h2 className="eyebrow-h">Start here</h2><p>{lesson.hook}</p></section>}
      {mode !== 'teacher' && lesson.mem && <section className="cur-mem" aria-label="Learn by heart"><h2 className="eyebrow-h">Learn by heart</h2><p>{lesson.mem}</p></section>}

      {mode === 'teacher' && (
        <>
          <section className="sect">
            <h2 className="eyebrow-h">Objectives</h2>
            <ul>
              <li>Students will {band.verbs.split(', ').slice(0, 2).join(' or ')} the big idea in their own words.</li>
              {words.length > 0 && <li>Students will use the new words correctly: {words.map((v) => gl[v].w).join(', ')}.</li>}
              <li>Students will connect the lesson to Scripture ({lesson.scripture.replace(/;/g, '; ')}) and the Catechism (§{lesson.ccc}).</li>
              <li>Students will respond in prayer and in one concrete way this week.</li>
            </ul>
          </section>
          <section className="sect">
            <h2 className="eyebrow-h">Plan <select className="no-print" value={length || band.minutes} onChange={(e) => setLength(+e.target.value)} aria-label="Class length" style={{ marginLeft: 8 }}>{[20, 30, 40, 45, 50, 60, 75].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></h2>
            <ol className="cur-plan">
              {band.plan.map(([name, share, how], i) => (
                <li key={name}>
                  <strong>{name}</strong> <span className="muted small">({mins(minutes, share)} min)</span>
                  <div>{how}</div>
                  {i === 1 && <div className="small"><em>This lesson:</em> {lesson.hook ? <>open with this: {lesson.hook} Then ask, “{lesson.question}”</> : <>ask, “{lesson.question}” and collect first answers before teaching.</>}</div>}
                  {i === 2 && <div className="small"><em>This lesson:</em> {lesson.idea} Read {lesson.scripture.replace(/;/g, ', ')} aloud. {words.length ? `Introduce: ${words.map((v) => gl[v].w).join(', ')}.` : ''}</div>}
                  {i === 3 && <div className="small"><em>This lesson:</em> {lesson.activity}</div>}
                  {i === 4 && <div className="small"><em>This lesson:</em> {src.prayer ? `Pray: ${src.prayer.title}.` : 'Close with a spontaneous prayer of thanks.'} {lesson.assess ?? 'Exit ticket: one thing I learned, one question I still have.'}</div>}
                </li>
              ))}
            </ol>
          </section>
          <section className="sect">
            <h2 className="eyebrow-h">Background for the teacher</h2>
            <p className="muted small">Read these before you teach. The Catechism paragraphs are the Church’s own words; check your understanding against them.</p>
            {src.ccc.map((p) => <blockquote key={p.n} className="cur-ccc"><p>{p.t}</p><footer><Link to={`/study/catechism/${p.n}`}>Catechism §{p.n}</Link></footer></blockquote>)}
          </section>
          {lesson.teach && lesson.teach.length > 0 && (
            <section className="sect">
              <h2 className="eyebrow-h">Talking points</h2>
              <ul>{lesson.teach.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}
          {lesson.misc && lesson.misc.length > 0 && (
            <section className="sect">
              <h2 className="eyebrow-h">Listen for these misunderstandings</h2>
              <ul>{lesson.misc.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}
          <section className="sect">
            <h2 className="eyebrow-h">Check for understanding</h2>
            <ul>{band.assess.map((a) => <li key={a}>{a}</li>)}<li>Ask: “{lesson.question}”</li></ul>
          </section>
          <section className="sect">
            <h2 className="eyebrow-h">Support and stretch</h2>
            <div className="cur-two"><div><h3>Support</h3><ul>{band.support.map((a) => <li key={a}>{a}</li>)}</ul></div><div><h3>Extend</h3><ul>{band.extend.map((a) => <li key={a}>{a}</li>)}</ul></div></div>
          </section>
          <section className="sect">
            <h2 className="eyebrow-h">Materials</h2>
            <ul><li>A Bible (the app’s reader works) and the printed handout (use Print).</li><li>For the activity: {lesson.activity.toLowerCase().includes('draw') || lesson.activity.toLowerCase().includes('make') ? 'paper, crayons or markers and simple craft supplies.' : 'whatever the activity names; most need only paper and pencils.'}</li>{src.prayer && <li>The prayer: {src.prayer.title} (printed or on screen).</li>}</ul>
          </section>
          <section className="sect">
            <h2 className="eyebrow-h">Family connection (copy home)</h2>
            <p>This week we learned: <em>{lesson.idea}</em> At home, read {lesson.scripture.replace(/;/g, ' or ')} together and talk about: {lesson.question}</p>
          </section>
        </>
      )}

      {mode === 'family' && !adult && (
        <section className="sect">
          <h2 className="eyebrow-h">A week at home</h2>
          <p className="muted small">About 10 to 20 minutes a day. Start each day with the Sign of the Cross and end with the Our Father or the lesson’s prayer.</p>
          <ol className="cur-plan">
            {FAMILY_DAYS.map(([d, t], i) => (
              <li key={d}><strong>{d}</strong><div>{t}</div>
                {i === 0 && <div className="small"><em>Read:</em> {lesson.scripture.replace(/;/g, ', ')}. <em>Wonder:</em> {lesson.question}</div>}
                {i === 2 && <div className="small"><em>Activity:</em> {lesson.activity}</div>}
                {i === 3 && <div className="small"><em>Pray:</em> {src.prayer?.title ?? 'the Our Father'}. <em>New words:</em> {words.map((v) => gl[v].w).join(', ') || 'none'}.</div>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {words.length > 0 && (
        <section className="sect" aria-label="Words to know">
          <h2 className="eyebrow-h">Words to know</h2>
          <dl className="cur-words">{words.map((v) => <div key={v}><dt>{gl[v].w}</dt><dd>{gl[v].d}</dd></div>)}</dl>
        </section>
      )}

      <section className="sect" aria-label="Scripture">
        <h2 className="eyebrow-h">{kidsText ? 'The story' : 'Scripture'}</h2>
        {kidsText && <><p className="cur-story">{kidsText}</p><p className="muted small">Retold from {src.story!.title}. <Link to={`/study/kids/${src.story!.id}`}>Open the story page</Link></p></>}
        {src.passages.map((p) => (
          <blockquote key={p.label} className="cur-scripture">
            <p>{p.verses.map((v) => <span key={`${p.label}${v.c}:${v.v}`}><sup>{v.v}</sup>{v.text} </span>)}</p>
            <footer>{p.label} · <Link to={p.path}>Read it in the Bible</Link>{!primary && <> · <Link to={`/study/passage/${src.refIds[src.passages.indexOf(p)] ?? ''}`}>Study this passage</Link></>}</footer>
          </blockquote>
        ))}
        {!src.passages.length && <p className="muted small">Loading the passage… {lesson.scripture}</p>}
      </section>

      <section className="sect" aria-label="Catechism">
        <h2 className="eyebrow-h">{primary ? 'For grown-ups: the Catechism' : 'What the Church teaches'}</h2>
        {primary
          ? <details><summary>Catechism §{lesson.ccc}</summary>{src.ccc.map((p) => <blockquote key={p.n} className="cur-ccc"><p>{p.t}</p><footer>§{p.n}</footer></blockquote>)}</details>
          : src.ccc.slice(0, g.band === 'elementary' ? 2 : g.band === 'adult' ? 8 : 6).map((p) => <blockquote key={p.n} className="cur-ccc"><p>{p.t}</p><footer><Link to={`/study/catechism/${p.n}`}>Catechism §{p.n}</Link></footer></blockquote>)}
        {!primary && cccNums.length > (g.band === 'elementary' ? 2 : g.band === 'adult' ? 8 : 6) && <p className="small"><Link to={`/study/catechism/${cccNums[0]}`}>More in the Catechism</Link></p>}
      </section>

      {(src.videos.length > 0 || src.art.length > 0) && (
        <section className="sect no-print" aria-label="Watch and look">
          <h2 className="eyebrow-h">Watch and look</h2>
          {src.videos.map((v) => (
            <div key={v.id} className="card" style={{ marginBottom: 8 }}>
              {playing === v.id ? <InlinePlayer embed={embedFor(`https://www.youtube.com/watch?v=${v.id}`)!} title={v.title} /> : <button className="btn" onClick={() => setPlaying(v.id)}>▶ {v.title}</button>}
              <div className="muted small">{v.channel}. Watch it yourself first; it is a link to a creator’s video, not part of this program.</div>
            </div>
          ))}
          {src.art.length > 0 && <div className="kids-art">{src.art.map((a) => <figure key={a.id}><img src={import.meta.env.BASE_URL + a.file} alt={a.title} loading="lazy" /><figcaption className="small muted">{a.title}, {a.artist}</figcaption></figure>)}</div>}
        </section>
      )}

      <section className="sect" aria-label="Think and talk">
        <h2 className="eyebrow-h">Think and talk</h2>
        <p className="cur-idea">{lesson.question}</p>
        {lesson.talk && lesson.talk.length > 0 && <ul>{lesson.talk.map((t) => <li key={t}>{t}</li>)}</ul>}
        <label className="small no-print">Your thoughts (kept on this device)
          <textarea value={note} onChange={(e) => { setNote(e.target.value); try { localStorage.setItem(`sb:cur:note:${lessonId}`, e.target.value); } catch { /* private mode */ } }} rows={3} style={{ width: '100%' }} />
        </label>
        <div className="print-only-lines" aria-hidden="true" />
      </section>

      <section className="sect" aria-label="Do">
        <h2 className="eyebrow-h">Do</h2>
        <p>{lesson.activity}</p>
      </section>

      {lesson.life && (
        <section className="sect" aria-label="Live it">
          <h2 className="eyebrow-h">Live it this week</h2>
          <p>{lesson.life}</p>
        </section>
      )}

      {lesson.saint && (
        <section className="sect" aria-label="A saint who lived this">
          <h2 className="eyebrow-h">A saint who lived this</h2>
          <p><strong>{lesson.saint.split(':')[0]}.</strong>{lesson.saint.includes(':') ? lesson.saint.slice(lesson.saint.indexOf(':') + 1) : ''}</p>
        </section>
      )}

      {src.prayer && (
        <section className="sect" aria-label="Pray">
          <h2 className="eyebrow-h">Pray: {src.prayer.title}</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{src.prayer.text}</p>
        </section>
      )}

      <section className="sect no-print" aria-label="Check">
        <h2 className="eyebrow-h">Check what you learned</h2>
        <Quiz key={lesson.id} qs={quiz} />
        {vocabOnly.length > 0 && <><h3>Words</h3><Quiz key={lesson.id + 'v'} qs={vocabOnly} /></>}
        {review.length > 0 && <><h3>Remember earlier lessons</h3><Quiz key={lesson.id + 'r'} qs={review} /></>}
      </section>

      <section className="sect no-print" aria-label="Go deeper">
        <h2 className="eyebrow-h">Go deeper</h2>
        <ul>
          <li><Link to={`/study/catechism/${cccNums[0]}`}>The Catechism at §{cccNums[0]}</Link></li>
          {(lesson.deeper ?? []).map((d) => { const [k, id] = d.split(':'); return k === 'apol' ? <li key={d}><Link to={`/study/apologetics/${id}`}>Questions about the faith: {id.replace(/-/g, ' ')}</Link></li> : <li key={d}><Link to={`/room/work/${id}/0`}>Read in the Reading room: {id.replace(/-/g, ' ')}</Link></li>; })}
          {!primary && <li><Link to="/room">Read: saints and Fathers</Link></li>}
          {(g.band === 'high' || g.band === 'middle') && <li><Link to="/study/apologetics">Questions about the faith</Link></li>}
          <li><Link to="/study/kids">The Children’s Bible</Link></li>
          <li><Link to="/pray/prayers">The prayer book</Link></li>
          <li><Link to="/study/curriculum/teachers">For teachers: the handbook</Link></li>
        </ul>
      </section>

      <nav className="row between no-print" style={{ marginTop: 18 }} aria-label="Previous and next lesson">
        {prev ? <Link className="btn" to={`/study/curriculum/${g.id}/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link className="btn primary" to={`/study/curriculum/${g.id}/${next.id}`}>{next.title} →</Link> : <Link className="btn primary" to={`/study/curriculum/${g.id}`}>Finish this grade</Link>}
      </nav>
      <p className="muted small">This program is a study aid built from the Catechism and Scripture. It has not been reviewed or approved by a bishop. If you teach for a parish, school or diocese, follow your diocese’s requirements for catechetical texts.</p>
      {present && <LessonSlides slides={slides} onClose={() => { setPresent(false); if (sp.get('present')) { sp.delete('present'); setSp(sp, { replace: true }); } }} />}
    </div>
  );
}
