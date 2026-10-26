import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import InlinePlayer from '../components/InlinePlayer';
import { embedFor } from '../lib/embed';
import type { Video } from '../data/videos';
import type { CccPara } from '../data/ccc';
import type { BookPrayer } from '../data/prayerbook';
import type { Passage } from './useLessonSources';
import { gradeLabel, type GradeData, type Glossary, type LessonSpec, type Question } from './model';
import type { Band } from './pedagogy';

type Kind = 'poll' | 'myth' | 'debate' | 'timer' | 'exit' | 'meet' | 'title' | 'wonder' | 'idea' | 'goals' | 'vocab' | 'story' | 'scripture' | 'image' | 'church' | 'video' | 'points' | 'talk' | 'do' | 'saint' | 'quiz' | 'life' | 'prayer' | 'end';
interface Slide { poll?: string[]; reveal?: string; seconds?: number; sides?: string[]; frames?: string[]; kind: Kind; label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string; credit: string }; video?: Video; q?: Question; notes?: string[]; word?: { w: string; d: string } }

/** Splits text into pieces of roughly `max` characters on sentence boundaries. */
export function chunk(text: string, max: number): string[] {
  const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?”"])\s+/);
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (cur && (cur + ' ' + p).length > max) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) out.push(cur);
  return out;
}
const short = (s: string, n: number) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);

export function buildSlides(a: { lesson: LessonSpec & { unit: GradeData['units'][number] }; grade: GradeData; gl: Glossary; band: Band; passages: Passage[]; ccc: CccPara[]; videos: Video[]; art: { file: string; title: string; artist: string }[]; story: string; prayer: BookPrayer | null; quiz: Question[]; base: string }): Slide[] {
  const { lesson, grade, gl, band, passages, ccc, videos, art, story, prayer, quiz, base } = a;
  const younger = grade.band === 'primary' || grade.band === 'elementary';
  const s: Slide[] = [];
  const older = !younger;
  const mistaken = (lesson.misc ?? []).map((m) => m.replace(/^[“"‘']+|[”"’']+$/g, '').trim()).filter((m) => m.length > 10 && m.length < 200);
  s.push({ kind: 'title', label: `${gradeLabel(grade.id)} · Unit ${lesson.unit.n}`, title: lesson.title, body: lesson.unit.title, notes: [`Essential question: ${lesson.unit.eq}`, `Plan about ${band.minutes} minutes. Start with the opening prayer.`] });
  // 1. hook: a poll, so everyone has a stake before anything is taught
  if (mistaken[0]) s.push({ kind: 'poll', label: 'Hands up!', title: `What do you think? “${mistaken[0]}”`, poll: older ? ['Agree', 'Disagree', 'Not sure'] : ['Yes', 'No', 'Not sure'], notes: ['Have students vote before you teach anything. Do not say who is right yet; you will come back to it. Ask one person from each side why.'] });
  s.push({ kind: 'wonder', label: 'Let’s wonder', title: lesson.question, notes: ['Ask before you teach. Collect two or three answers, and write them where everyone can see.', ...band.plan.slice(1, 2).map((p) => p[2])] });
  // 2. a story first: a person who lived it
  if (lesson.saint) { const i = lesson.saint.indexOf(':'); const nm = i > 0 ? lesson.saint.slice(0, i) : lesson.saint; s.push({ kind: 'meet', label: 'Meet someone', title: nm, body: i > 0 ? lesson.saint.slice(i + 1).trim() : '', notes: ['Tell this as a short story, not a fact. Ask: what would it have been like to be there? We will see why they matter at the end.'] }); }
  s.push({ kind: 'idea', label: 'The big idea', title: lesson.idea, notes: lesson.teach?.slice(0, 1) });
  const words = lesson.vocab.filter((v) => gl[v]);
  s.push({ kind: 'goals', label: 'Today we will', items: [`Learn: ${short(lesson.idea, 110)}`, ...(words.length ? [`Use new words: ${words.slice(0, 4).map((v) => gl[v].w).join(', ')}`] : []), `Hear God’s word: ${lesson.scripture.split(';')[0]}`, `Pray${prayer ? `: ${prayer.title}` : ''}`] });
  for (const v of words) s.push({ kind: 'vocab', label: 'Word to know', word: gl[v], notes: [younger ? 'Say the word, have everyone repeat it, then act it out or draw it in the air. Ask for an example from life.' : 'Say the word, read the meaning, then ask a pair to use it in a sentence about their own life.'] });
  if (story) for (const c of chunk(story, younger ? 230 : 320)) s.push({ kind: 'story', label: 'The story', body: c, notes: ['Read this slowly. Pause after each slide and ask, “What do you notice?”'] });
  for (const p of passages) {
    const text = p.verses.map((v) => `${v.v} ${v.text}`).join(' ');
    const pieces = chunk(text, younger ? 260 : 380);
    pieces.forEach((c, i) => s.push({ kind: 'scripture', label: 'Scripture', body: c, ref: `${p.label}${pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ''}`, notes: i === 0 ? ['Read it aloud twice. The second time, ask students to listen for one word or phrase, and say it back.'] : undefined }));
  }
  art.slice(0, 2).forEach((x) => s.push({ kind: 'image', label: 'Look', img: { src: base + x.file, alt: x.title, credit: `${x.title}, ${x.artist}` }, notes: ['See, think, wonder: What do you see? What do you think is happening? What do you wonder?'] }));
  if (!younger) ccc.slice(0, 3).forEach((p) => s.push({ kind: 'church', label: `What the Church teaches · Catechism §${p.n}`, body: short(p.t, 460), notes: ['The Church’s own words. Read aloud, then ask a pair to put it in their own words.'] }));
  else if (ccc[0]) s.push({ kind: 'church', label: 'What the Church teaches', body: lesson.idea, notes: [`For you: Catechism §${lesson.ccc.split(',')[0]} says: ${short(ccc[0].t, 300)}`] });
  if (videos[0]) s.push({ kind: 'video', label: 'Watch', video: videos[0], notes: ['Watch it yourself first. It is a creator’s video, not part of this program. Pause to ask questions.'] });
  if ((grade.band === 'high' || grade.band === 'adult' || grade.band === 'middle') && lesson.teach?.length) s.push({ kind: 'points', label: 'Key points', items: lesson.teach.map((t) => short(t, 190)), notes: ['These are your talking points. Put the main ideas in your own voice.'] });
  // 3. think, pair, share, with a clock
  (lesson.talk ?? []).forEach((q, i) => s.push({ kind: 'timer', label: `Think · Pair · Share ${i + 1}`, title: q, seconds: 90, notes: ['One minute alone, thinking. One minute with a partner. Then two or three share with everyone.'] }));
  // 4. a mini-game: myth or truth, from the common mistakes
  const myths = mistaken.slice(0, 2).map((m) => ({ text: m, truth: false }));
  const truths = [lesson.idea.split(/(?<=[.!?])\s/)[0]].filter((t) => t.length > 15).map((t) => ({ text: t, truth: true }));
  const round = [...myths, ...truths].sort((x, y) => (x.text.length * 7) % 5 - (y.text.length * 7) % 5);
  round.forEach((r, i) => s.push({ kind: 'myth', label: `Myth or truth? ${i + 1} of ${round.length}`, title: r.text, reveal: r.truth ? 'TRUTH. This is what the Church teaches.' : `MYTH. ${lesson.idea}`, notes: ['Everyone stands for TRUTH or stays seated for MYTH (or points left or right). Reveal, then ask someone to explain why.'] }));
  // 5. debate for older students
  if (older && mistaken[0]) s.push({ kind: 'debate', label: 'Debate', title: mistaken[0], sides: ['Agree', 'Disagree'], frames: ['I agree because…', 'I see it differently because…', 'The Church would answer…', 'A question I still have is…'], reveal: lesson.idea, notes: ['Four corners: students move to AGREE or DISAGREE. Give each side two minutes to prepare, then hear one reason from each. Ask: what is the best argument on the other side? Then reveal what the Church teaches.'] });
  s.push({ kind: 'do', label: younger ? 'Let’s play and make' : 'Let’s do it', title: lesson.activity, notes: lesson.misc?.length ? [`Listen for: ${lesson.misc.join(' · ')}`] : undefined });
  quiz.forEach((q, i) => s.push({ kind: 'quiz', label: `Check · ${i + 1} of ${quiz.length}`, q, notes: ['Let students answer before you reveal. Ask why.'] }));
  if (lesson.saint) { const i = lesson.saint.indexOf(':'); s.push({ kind: 'saint', label: 'Why they matter', title: i > 0 ? lesson.saint.slice(0, i) : lesson.saint, body: i > 0 ? lesson.saint.slice(i + 1).trim() : '', notes: ['Return to the story from the start. What did this person do that shows today’s idea?'] }); }
  if (lesson.life) s.push({ kind: 'life', label: 'This week', title: lesson.life });
  s.push({ kind: 'exit', label: 'Exit ticket', title: older ? '3 · 2 · 1' : 'Before you go', items: older ? ['3 things I learned', '2 things I am still wondering', '1 thing I will do this week'] : ['One thing I learned', 'One thing I want to ask', 'One way I will show it this week'], notes: ['Collect on a card or a sticky note. Read them before next class.'] });
  if (prayer) {
    const pieces = chunk(prayer.text, 280);
    pieces.forEach((c, i) => s.push({ kind: 'prayer', label: prayer.title + (pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ''), body: c }));
  }
  s.push({ kind: 'end', label: 'Go in peace', title: 'Thanks be to God', body: 'Make the Sign of the Cross together.' });
  return s;
}

/** Real slides for the lesson: a title slide, the question, the idea, each word, the Scripture in pieces, art, the Catechism, discussion, the activity, a saint, a check with answers, and a closing prayer. */
export default function LessonSlides({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(false);
  const [reveal, setReveal] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const go = (n: number) => { setI(Math.max(0, Math.min(slides.length - 1, n))); setReveal(false); };
  const next = () => { const sl = slides[i]; if ((sl.kind === 'quiz' || sl.kind === 'myth' || sl.kind === 'debate') && !reveal) setReveal(true); else go(i + 1); };
  useEffect(() => { root.current?.focus(); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1);
      else if (e.key === 'Home') go(0); else if (e.key === 'End') go(slides.length - 1);
      else if (e.key === 'n' || e.key === 'N') setNotes((x) => !x);
      else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.().catch(() => undefined); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [i, reveal, slides.length]);
  const sl = slides[i];
  return createPortal(
    <div ref={root} tabIndex={-1} className={`slides sk-${sl.kind}`} role="dialog" aria-modal="true" aria-label="Lesson slides"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); }}>
      <div className="sl-top">
        <span className="sl-label">{sl.label}</span>
        <span className="sl-tools">
          <button className="btn small" onClick={() => setNotes(!notes)} aria-pressed={notes} title="Teacher notes (N)">Notes</button>
          <button className="btn small" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.())} title="Full screen (F)">⛶</button>
          <button className="btn small" onClick={onClose}>Close (Esc)</button>
        </span>
      </div>
      <div className="sl-stage" onClick={(e) => { if ((e.target as HTMLElement).closest('button,iframe,a,summary')) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); if (e.clientX - r.left < r.width * 0.3) go(i - 1); else next(); }}>
        <div className="sl-body" key={i}>
          {sl.kind === 'title' && <><h1 className="sl-title">{sl.title}</h1><p className="sl-sub">{sl.body}</p></>}
          {(sl.kind === 'wonder' || sl.kind === 'idea' || sl.kind === 'talk' || sl.kind === 'do' || sl.kind === 'life') && <h1 className="sl-big">{sl.title}</h1>}
          {sl.kind === 'goals' && <ul className="sl-list">{sl.items!.map((t) => <li key={t}>{t}</li>)}</ul>}
          {sl.kind === 'points' && <ul className="sl-list sm">{sl.items!.map((t) => <li key={t}>{t}</li>)}</ul>}
          {sl.kind === 'vocab' && <><h1 className="sl-word">{sl.word!.w}</h1><p className="sl-def">{sl.word!.d}</p></>}
          {sl.kind === 'story' && <p className="sl-story">{sl.body}</p>}
          {sl.kind === 'scripture' && <blockquote className="sl-verse"><p>{sl.body}</p><footer>{sl.ref}</footer></blockquote>}
          {sl.kind === 'church' && <blockquote className="sl-church"><p>{sl.body}</p></blockquote>}
          {sl.kind === 'image' && sl.img && <figure className="sl-fig"><img src={sl.img.src} alt={sl.img.alt} /><figcaption>{sl.img.credit}</figcaption></figure>}
          {sl.kind === 'video' && sl.video && <div className="sl-video"><InlinePlayer embed={embedFor(`https://www.youtube.com/watch?v=${sl.video.id}`)!} title={sl.video.title} /><p className="sl-sub">{sl.video.title} · {sl.video.channel}</p></div>}
          {sl.kind === 'saint' && <><h1 className="sl-word">{sl.title}</h1><p className="sl-def">{sl.body}</p></>}
          {sl.kind === 'quiz' && sl.q && (
            <div className="sl-quiz">
              <h1 className="sl-big sm">{sl.q.q}</h1>
              <ol type="A" className="sl-opts">{sl.q.options.map((o, j) => <li key={j} className={reveal ? (j === sl.q!.answer ? 'right' : 'dim') : ''}>{o}</li>)}</ol>
              {reveal ? <p className="sl-why">{sl.q.why}</p> : <p className="sl-hint">Click or press Space to reveal the answer</p>}
            </div>
          )}
          {sl.kind === 'poll' && sl.poll && <PollView sl={sl} />}
          {sl.kind === 'meet' && <><p className="sl-sub">Meet</p><h1 className="sl-word">{sl.title}</h1><p className="sl-def">{sl.body}</p></>}
          {sl.kind === 'myth' && <div className="sl-myth"><p className="sl-kicker">Stand up for truth. Stay seated for myth.</p><h1 className="sl-big">“{sl.title}”</h1>{reveal ? <p className={`sl-reveal ${sl.reveal?.startsWith('TRUTH') ? 'ok' : 'no'}`}>{sl.reveal}</p> : <p className="sl-hint">Click or press Space to reveal</p>}</div>}
          {sl.kind === 'debate' && <div className="sl-debate"><p className="sl-kicker">Move to a corner</p><h1 className="sl-big sm">“{sl.title}”</h1><div className="sl-sides">{sl.sides!.map((x) => <div key={x}>{x}</div>)}</div><ul className="sl-frames">{sl.frames!.map((f) => <li key={f}>{f}</li>)}</ul>{reveal ? <p className="sl-reveal ok">The Church teaches: {sl.reveal}</p> : <p className="sl-hint">Click to reveal what the Church teaches</p>}</div>}
          {sl.kind === 'timer' && <TimerView sl={sl} />}
          {sl.kind === 'exit' && <><h1 className="sl-word">{sl.title}</h1><ul className="sl-list">{sl.items!.map((t) => <li key={t}>{t}</li>)}</ul></>}
          {sl.kind === 'prayer' && <blockquote className="sl-prayer"><p>{sl.body}</p></blockquote>}
          {sl.kind === 'end' && <><h1 className="sl-title">{sl.title}</h1><p className="sl-sub">{sl.body}</p></>}
        </div>
      </div>
      {notes && <aside className="sl-notes" aria-label="Teacher notes"><strong>Notes</strong>{sl.notes?.length ? <ul>{sl.notes.map((n) => <li key={n}>{n}</li>)}</ul> : <p className="muted">No notes for this slide.</p>}</aside>}
      <div className="sl-bar"><i style={{ width: `${((i + 1) / slides.length) * 100}%` }} /></div>
      <div className="sl-nav">
        <button className="btn" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
        <span aria-live="polite">{i + 1} / {slides.length}</span>
        <button className="btn primary" onClick={next} disabled={i === slides.length - 1 && !((sl.kind === 'quiz' || sl.kind === 'myth' || sl.kind === 'debate') && !reveal)}>{(sl.kind === 'quiz' || sl.kind === 'myth' || sl.kind === 'debate') && !reveal ? 'Reveal' : 'Next →'}</button>
      </div>
    </div>,
    document.body,
  );
}

/** A hand-count poll for a class with no devices: tap an answer each time a hand goes up. */
function PollView({ sl }: { sl: Slide }) {
  const [n, setN] = useState<number[]>(() => sl.poll!.map(() => 0));
  const total = n.reduce((a, b) => a + b, 0);
  return (
    <div className="sl-poll">
      <h1 className="sl-big sm">{sl.title}</h1>
      <div className="sl-poll-opts">{sl.poll!.map((o, k) => <div key={o} className={`sl-poll-opt o${k}`}><button className="btn" aria-label={`Add a vote for ${o}`} onClick={(e) => { e.stopPropagation(); setN(n.map((x, j) => (j === k ? x + 1 : x))); }}>{o}</button><strong>{n[k]}</strong><span className="sl-poll-bar"><i style={{ width: `${total ? (n[k] / total) * 100 : 0}%` }} /></span></div>)}</div>
      <p className="sl-hint">Tap an answer for each hand that goes up. In a live class, students vote on their own devices.</p>
    </div>
  );
}

/** A task with a countdown the whole room can see. */
function TimerView({ sl }: { sl: Slide }) {
  const [left, setLeft] = useState(sl.seconds ?? 90);
  const [on, setOn] = useState(false);
  useEffect(() => { if (!on) return; const id = setInterval(() => setLeft((x) => { if (x <= 1) { setOn(false); return 0; } return x - 1; }), 1000); return () => clearInterval(id); }, [on]);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <div className="sl-timer">
      <h1 className="sl-big">{sl.title}</h1>
      <div className="sl-clock"><span className={left === 0 ? 'done' : ''}>{left === 0 ? '⏰ Time!' : mm}</span><button className="btn" onClick={(e) => { e.stopPropagation(); if (left === 0) setLeft(sl.seconds ?? 90); setOn(!on); }}>{on ? 'Pause' : left === 0 ? 'Again' : 'Start the clock'}</button></div>
    </div>
  );
}
