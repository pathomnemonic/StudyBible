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

type Kind = 'poll' | 'myth' | 'debate' | 'timer' | 'exit' | 'meet' | 'title' | 'wonder' | 'idea' | 'goals' | 'vocab' | 'story' | 'scripture' | 'image' | 'church' | 'video' | 'points' | 'point' | 'section' | 'talk' | 'do' | 'saint' | 'quiz' | 'life' | 'prayer' | 'end';
interface Card { k: string; v: string }
interface Slide {
  kind: Kind; label: string; title?: string; body?: string; items?: string[]; ref?: string;
  poll?: string[]; reveal?: string; seconds?: number; sides?: string[]; frames?: string[];
  img?: { src: string; alt: string; credit: string }; video?: Video; q?: Question; notes?: string[]; word?: { w: string; d: string };
  /** a picture behind the slide, under a scrim */
  bg?: string;
  /** which of the four parts of the Catechism the lesson belongs to, for the colors */
  theme?: string;
  /** big numbered or labelled cards that appear one by one */
  cards?: Card[];
  /** small chips, e.g. Catechism paragraph numbers */
  chips?: string[];
  /** words to pick out in color */
  hi?: string[];
  /** a number shown large (section number, point number) */
  n?: number;
  of?: number;
}

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
/** The first sentence, kept to about `n` characters, for a slide's headline. */
export function headline(t: string, n = 90): { head: string; rest: string } {
  const clean = t.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^(.+?[.!?:])(?:\s+(.*))?$/);
  let head = m ? m[1] : clean;
  let rest = m?.[2] ?? '';
  if (head.length > n) {
    const cut = head.lastIndexOf(',', n) > n * 0.5 ? head.lastIndexOf(',', n) : head.lastIndexOf(' ', n);
    rest = (head.slice(cut + 1).trim() + ' ' + rest).trim();
    head = head.slice(0, cut).replace(/[,;:]$/, '') + '…';
  }
  return { head: head.replace(/[.:]$/, ''), rest };
}
/** Pulls "(CCC 1234)" style citations out of a sentence, leaving the sentence and the numbers apart. */
export function splitCcc(t: string): { text: string; chips: string[] } {
  const chips: string[] = [];
  const text = t.replace(/\s*\((?:see )?(?:CCC|Catechism)\s*([^)]*)\)/gi, (_, n: string) => { if (!chips.includes(`CCC ${n.trim()}`)) chips.push(`CCC ${n.trim()}`); return ''; }).replace(/\s{2,}/g, ' ').trim();
  return { text, chips };
}
export const pillarKey = (p: string) => (/creed|revel|faith|god|trinity|christ|church|mary|last/i.test(p) ? 'creed' : /sacrament|liturg|worship|mass|eucharist/i.test(p) ? 'sacrament' : /moral|life|commandment|virtue|beatitude|justice|vocation/i.test(p) ? 'moral' : /prayer|pray/i.test(p) ? 'prayer' : 'creed');

export function buildSlides(a: { lesson: LessonSpec & { unit: GradeData['units'][number] }; grade: GradeData; gl: Glossary; band: Band; passages: Passage[]; ccc: CccPara[]; videos: Video[]; art: { file: string; title: string; artist: string }[]; story: string; prayer: BookPrayer | null; quiz: Question[]; base: string }): Slide[] {
  const { lesson, grade, gl, band, passages, ccc, videos, art, story, prayer, quiz, base } = a;
  const younger = grade.band === 'primary' || grade.band === 'elementary';
  const older = !younger;
  const theme = pillarKey(lesson.unit.pillar);
  const s: Slide[] = [];
  const add = (x: Slide) => { s.push({ theme, ...x }); };
  let sec = 0;
  const section = (title: string, sub: string) => add({ kind: 'section', label: title, title, body: sub, n: ++sec, bg: art[sec % Math.max(1, art.length)] ? base + art[sec % Math.max(1, art.length)].file : undefined });
  const words = lesson.vocab.filter((v) => gl[v]);
  const hi = words.map((v) => gl[v].w);
  const mistaken = (lesson.misc ?? []).map((m) => m.replace(/^[“"‘']+|[”"’']+$/g, '').trim()).filter((m) => m.length > 10 && m.length < 200);
  const sources = lesson.saint ? lesson.saint.split(':') : [];
  const personName = lesson.saint && lesson.saint.indexOf(':') > 0 ? sources[0] : lesson.saint ?? '';
  const personStory = lesson.saint && lesson.saint.indexOf(':') > 0 ? lesson.saint.slice(lesson.saint.indexOf(':') + 1).trim() : '';

  add({ kind: 'title', label: `${gradeLabel(grade.id)} · Unit ${lesson.unit.n}`, title: lesson.title, body: lesson.question, chips: [lesson.unit.pillar, lesson.unit.title], bg: art[0] ? base + art[0].file : undefined, notes: [`Essential question: ${lesson.unit.eq}`, `Plan about ${band.minutes} minutes. Start with the opening question, then teach, discuss, practice and pray.`] });
  if (mistaken[0]) add({ kind: 'poll', label: 'Hands up!', title: `What do you think? “${mistaken[0]}”`, poll: older ? ['Agree', 'Disagree', 'Not sure'] : ['Yes', 'No', 'Not sure'], notes: ['Have students vote before you teach anything. Come back to this vote at the end and see who changed their mind.'] });
  if (lesson.hook) add({ kind: 'story', label: 'Start here', body: lesson.hook, notes: ['Tell or read this to open the lesson, then ask the big question.'] });
  add({ kind: 'wonder', label: 'Let’s wonder', title: lesson.question, notes: ['Ask before you teach. Collect two or three answers and write them where everyone can see.'] });
  add({ kind: 'goals', label: 'Today', title: 'Today we will…', cards: [
    { k: 'Learn', v: headline(lesson.idea, 80).head },
    ...(words.length ? [{ k: 'Words', v: words.slice(0, 3).map((v) => gl[v].w).join(' · ') }] : []),
    { k: 'Hear', v: lesson.scripture.split(';').slice(0, 2).join(' · ') },
    { k: 'Do', v: headline(lesson.activity, 70).head },
  ], items: [`Learn: ${short(lesson.idea, 110)}`], notes: ['Each card appears as you click. Say what each one means for today.'] });

  section('Explore', 'See it, hear it, name it');
  if (lesson.saint) add({ kind: 'meet', label: 'Meet someone', title: personName, body: personStory, notes: ['Tell the story in your own words. Ask: what made this person brave, kind or faithful?'] });
  { const { head, rest } = headline(lesson.idea, 120); add({ kind: 'idea', label: 'The big idea', title: head, body: rest, hi, notes: lesson.teach?.slice(0, 1) }); }
  for (const v of words) add({ kind: 'vocab', label: 'Word to know', word: gl[v], notes: [younger ? 'Say the word, have everyone repeat it, then act it out. Ask for an example from life.' : 'Say the word, read the meaning, and ask for an example or a non-example.'] });
  if (story) for (const c of chunk(story, younger ? 200 : 280)) add({ kind: 'story', label: 'The story', body: c, notes: ['Read slowly. Pause and ask, “What do you notice?”'] });
  for (const p of passages) {
    const text = p.verses.map((v) => `[[${v.v}]]${v.text}`).join(' ');
    const pieces = chunk(text, younger ? 190 : 250);
    pieces.forEach((c, i) => add({ kind: 'scripture', label: 'Scripture', body: c, ref: `${p.label}${pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ''}`, bg: art[1] ? base + art[1].file : undefined, notes: i === 0 ? ['Read it aloud twice. The second time, ask students to listen for one word that stands out.'] : undefined }));
  }
  art.slice(0, 2).forEach((x) => add({ kind: 'image', label: 'Look', img: { src: base + x.file, alt: x.title, credit: `${x.title}, ${x.artist}` }, bg: base + x.file, notes: ['See, think, wonder: What do you see? What do you think is happening? What do you wonder?'] }));
  if (!younger) ccc.slice(0, 3).forEach((p) => add({ kind: 'church', label: 'What the Church teaches', title: `Catechism §${p.n}`, body: chunk(p.t, 330)[0] ?? short(p.t, 330), hi, notes: ['The Church’s own words. Read aloud, then ask a pair to put it in their own words.'] }));
  else if (ccc[0]) add({ kind: 'church', label: 'What the Church teaches', title: 'We believe', body: headline(lesson.idea, 140).head, hi, notes: [`For you: Catechism §${lesson.ccc.split(',')[0]} says: ${short(ccc[0].t, 300)}`] });
  if (videos[0]) add({ kind: 'video', label: 'Watch', video: videos[0], notes: ['Watch it yourself first. It is a creator’s video, not part of this program. Pause to ask questions.'] });

  section('Understand', older ? 'The Church’s teaching, step by step' : 'Talk about it');
  if (older && lesson.teach?.length) lesson.teach.slice(0, 4).forEach((t, i, all) => {
    const { text, chips } = splitCcc(t);
    const { head, rest } = headline(text, 100);
    add({ kind: 'point', label: 'Key point', n: i + 1, of: all.length, title: head, body: short(rest, 230), chips, hi, notes: [text] });
  });
  (lesson.talk ?? []).forEach((q, i) => add({ kind: 'timer', label: `Think · Pair · Share ${i + 1}`, title: q, seconds: 90, notes: ['One minute alone, thinking. One minute with a partner. Then two or three share with everyone.'] }));

  section('Practice', 'Try it, test it, own it');
  const myths = mistaken.slice(0, 2).map((m) => ({ text: m, truth: false }));
  const truths = [lesson.idea.split(/(?<=[.!?])\s/)[0]].filter((t) => t.length > 15).map((t) => ({ text: t, truth: true }));
  const round = [...myths, ...truths].sort((x, y) => (x.text.length * 7) % 5 - (y.text.length * 7) % 5);
  round.forEach((r, i) => add({ kind: 'myth', label: `Myth or truth? ${i + 1} of ${round.length}`, title: r.text, reveal: r.truth ? 'TRUTH. This is what the Church teaches.' : `MYTH. ${lesson.idea}`, notes: ['Everyone stands for TRUTH or stays seated for MYTH. Then reveal and ask why.'] }));
  if (older && mistaken[0]) add({ kind: 'debate', label: 'Debate', title: mistaken[0], sides: ['Agree', 'Disagree'], frames: ['I agree because…', 'I see it differently because…', 'The Church would answer…', 'A question I still have…'], reveal: lesson.idea, notes: ['Two corners. Give each side two minutes, then reveal what the Church teaches.'] });
  add({ kind: 'do', label: younger ? 'Let’s play and make' : 'Let’s do it', title: lesson.activity, notes: lesson.misc?.length ? [`Listen for: ${lesson.misc.join(' · ')}`] : undefined });
  quiz.forEach((q, i) => add({ kind: 'quiz', label: `Check · ${i + 1} of ${quiz.length}`, q, notes: ['Let students answer before you reveal. Ask why.'] }));

  section('Live it', 'Carry it into the week');
  if (lesson.saint) add({ kind: 'saint', label: 'Why they matter', title: personName, body: personStory, notes: ['Return to the person from the start: what would they say about today’s idea?'] });
  if (lesson.life) add({ kind: 'life', label: 'This week', title: lesson.life });
  if (lesson.mem) add({ kind: 'prayer', label: 'Learn by heart', body: lesson.mem, notes: ['Say it together three times, then a second time with the words hidden.'] });
  add({ kind: 'exit', label: 'Exit ticket', title: older ? '3 · 2 · 1' : 'Before you go', items: older ? ['3 things I learned', '2 things I am still wondering', '1 thing I will do this week'] : ['One thing I learned', 'One thing I want to ask'], cards: older ? [{ k: '3', v: 'things I learned' }, { k: '2', v: 'things I still wonder' }, { k: '1', v: 'thing I will do' }] : [{ k: '1', v: 'thing I learned' }, { k: '?', v: 'one thing I want to ask' }], notes: lesson.assess ? [`Check for understanding: ${lesson.assess}`] : ['Collect these on paper or say them aloud.'] });
  if (prayer) {
    const pieces = chunk(prayer.text, 260);
    pieces.forEach((c, i) => add({ kind: 'prayer', label: prayer.title + (pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ''), body: c }));
  }
  add({ kind: 'end', label: 'Go in peace', title: 'Thanks be to God', body: 'Make the Sign of the Cross together.', bg: art[0] ? base + art[0].file : undefined });
  return s;
}

const REVEALS = new Set<Kind>(['quiz', 'myth', 'debate']);
const hasBuilds = (sl: Slide) => (sl.kind === 'goals' || sl.kind === 'exit') && (sl.cards?.length ?? 0) > 1;

/** Marks the lesson's own words in color inside a line of text. */
function Hl({ text, hi }: { text: string; hi?: string[] }) {
  const list = (hi ?? []).filter((w) => w.length > 2);
  if (!list.length) return <>{text}</>;
  const re = new RegExp(`\\b(${list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  return <>{text.split(re).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}
/** A verse with its numbers set small and raised. */
function Verse({ text }: { text: string }) {
  return <>{text.split(/\[\[(\d+)\]\]/).map((p, i) => (i % 2 ? <sup key={i}>{p}</sup> : <span key={i}>{p}</span>))}</>;
}

/** A real deck: a title with a picture, section dividers, one idea per slide, builds, big numerals, quotes, full-bleed art, a check with answers, a prayer. */
export default function LessonSlides({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(false);
  const [grid, setGrid] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [shown, setShown] = useState(1);
  const [idle, setIdle] = useState(false);
  const dir = useRef(1);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const timer = useRef(0);
  const go = (n: number) => { const c = Math.max(0, Math.min(slides.length - 1, n)); dir.current = c >= i ? 1 : -1; setI(c); setReveal(false); setShown(slides[c] && hasBuilds(slides[c]) ? (c < i ? slides[c].cards!.length : 1) : 1); };
  const next = () => {
    const sl = slides[i];
    if (REVEALS.has(sl.kind) && !reveal) setReveal(true);
    else if (hasBuilds(sl) && shown < sl.cards!.length) setShown(shown + 1);
    else go(i + 1);
  };
  const back = () => { const sl = slides[i]; if (hasBuilds(sl) && shown > 1) setShown(shown - 1); else go(i - 1); };
  useEffect(() => { root.current?.focus(); }, []);
  const wake = () => { setIdle(false); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setIdle(true), 3500); };
  useEffect(() => { wake(); return () => window.clearTimeout(timer.current); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      wake();
      if (grid) { if (e.key === 'Escape' || e.key === 'g' || e.key === 'G') { setGrid(false); e.preventDefault(); } return; }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') back();
      else if (e.key === 'Home') go(0); else if (e.key === 'End') go(slides.length - 1);
      else if (e.key === 'n' || e.key === 'N') setNotes((x) => !x);
      else if (e.key === 'g' || e.key === 'G') setGrid(true);
      else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.().catch(() => undefined); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [i, reveal, shown, grid, slides.length]);
  const sl = slides[i];
  const reveals = REVEALS.has(sl.kind) && !reveal;
  const building = hasBuilds(sl) && shown < sl.cards!.length;
  return createPortal(
    <div ref={root} tabIndex={-1} className={`slides sk-${sl.kind} th-${sl.theme ?? 'creed'}${idle ? ' idle' : ''}${sl.bg ? ' has-bg' : ''}`} role="dialog" aria-modal="true" aria-label="Lesson slides"
      onMouseMove={wake} onTouchStart={(e) => { wake(); touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 60) (dx < 0 ? next() : back()); }}>
      {sl.bg && <div className="sl-bg" style={{ backgroundImage: `url("${sl.bg}")` }} aria-hidden />}
      <div className="sl-deco" aria-hidden />
      <div className="sl-top">
        <span className="sl-label">{sl.label}</span>
        <span className="sl-tools">
          <button className="btn small" onClick={() => setGrid(true)} title="All slides (G)">▦</button>
          <button className="btn small" onClick={() => setNotes(!notes)} aria-pressed={notes} title="Teacher notes (N)">Notes</button>
          <button className="btn small" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.())} title="Full screen (F)">⛶</button>
          <button className="btn small" onClick={onClose}>Close (Esc)</button>
        </span>
      </div>
      <div className="sl-stage" onClick={(e) => { if ((e.target as HTMLElement).closest('button,iframe,a,summary')) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); if (e.clientX - r.left < r.width * 0.3) back(); else next(); }}>
        <div className={`sl-body ${dir.current < 0 ? 'from-left' : ''}`} key={i}>
          {sl.kind === 'title' && <>
            <div className="sl-chips">{sl.chips?.filter(Boolean).map((c) => <span key={c} className="sl-chip">{c}</span>)}</div>
            <h1 className="sl-title">{sl.title}</h1>
            <p className="sl-sub">{sl.body}</p>
          </>}
          {sl.kind === 'section' && <><span className="sl-numeral">{sl.n}</span><h1 className="sl-title">{sl.title}</h1><p className="sl-sub">{sl.body}</p></>}
          {sl.kind === 'wonder' && <><p className="sl-kicker">Let’s wonder</p><h1 className="sl-big">{sl.title}</h1></>}
          {sl.kind === 'idea' && <><p className="sl-kicker">The big idea</p><h1 className="sl-big"><Hl text={sl.title ?? ''} hi={sl.hi} /></h1>{sl.body && <p className="sl-support"><Hl text={sl.body} hi={sl.hi} /></p>}</>}
          {(sl.kind === 'talk' || sl.kind === 'life') && <><p className="sl-kicker">{sl.label}</p><h1 className="sl-big">{sl.title}</h1></>}
          {sl.kind === 'do' && <div className="sl-do"><span className="sl-do-ico" aria-hidden>✎</span><h1 className="sl-big sm">{sl.title}</h1></div>}
          {sl.kind === 'goals' && <><h1 className="sl-big sm">{sl.title}</h1><div className="sl-cards">{sl.cards!.slice(0, shown).map((c) => <div className="sl-card" key={c.k}><span className="sl-card-k">{c.k}</span><span className="sl-card-v">{c.v}</span></div>)}</div></>}
          {sl.kind === 'point' && <div className="sl-point">
            <span className="sl-numeral">{sl.n}<small>/{sl.of}</small></span>
            <div><h1 className="sl-big sm"><Hl text={sl.title ?? ''} hi={sl.hi} /></h1>{sl.body && <p className="sl-support"><Hl text={sl.body} hi={sl.hi} /></p>}
              {sl.chips && sl.chips.length > 0 && <div className="sl-chips">{sl.chips.map((c) => <span key={c} className="sl-chip">{c}</span>)}</div>}</div>
          </div>}
          {sl.kind === 'vocab' && <div className="sl-vocab"><p className="sl-kicker">Word to know</p><h1 className="sl-word">{sl.word!.w}</h1><p className="sl-def">{sl.word!.d}</p></div>}
          {sl.kind === 'story' && <p className="sl-story">{sl.body}</p>}
          {sl.kind === 'scripture' && <blockquote className="sl-verse"><span className="sl-qmark" aria-hidden>“</span><p><Verse text={sl.body ?? ''} /></p><footer>{sl.ref}</footer></blockquote>}
          {sl.kind === 'church' && <div className="sl-church"><span className="sl-chip big">{sl.title}</span><blockquote><p><Hl text={sl.body ?? ''} hi={sl.hi} /></p></blockquote></div>}
          {sl.kind === 'image' && sl.img && <figure className="sl-fig"><img src={sl.img.src} alt={sl.img.alt} /><figcaption>{sl.img.credit}</figcaption></figure>}
          {sl.kind === 'video' && sl.video && <div className="sl-video"><InlinePlayer embed={embedFor(`https://www.youtube.com/watch?v=${sl.video.id}`)!} title={sl.video.title} /><p className="sl-sub">{sl.video.title} · {sl.video.channel}</p></div>}
          {sl.kind === 'saint' && <><p className="sl-kicker">Why they matter</p><h1 className="sl-word">{sl.title}</h1><p className="sl-def">{sl.body}</p></>}
          {sl.kind === 'quiz' && sl.q && (
            <div className="sl-quiz">
              <h1 className="sl-big sm">{sl.q.q}</h1>
              <ol className="sl-opts">{sl.q.options.map((o, j) => <li key={j} className={reveal ? (j === sl.q!.answer ? 'right' : 'dim') : ''}><b>{'ABCD'[j]}</b><span>{o}</span></li>)}</ol>
              {reveal ? <p className="sl-why">{sl.q.why}</p> : <p className="sl-hint">Click or press Space to reveal the answer</p>}
            </div>
          )}
          {sl.kind === 'poll' && sl.poll && <PollView sl={sl} />}
          {sl.kind === 'meet' && <><p className="sl-kicker">Meet</p><h1 className="sl-word">{sl.title}</h1><p className="sl-def">{sl.body}</p></>}
          {sl.kind === 'myth' && <div className="sl-myth"><p className="sl-kicker">Stand up for truth. Stay seated for myth.</p><h1 className="sl-big">“{sl.title}”</h1>{reveal ? <p className={`sl-reveal ${sl.reveal?.startsWith('TRUTH') ? 'ok' : 'no'}`}>{sl.reveal}</p> : <p className="sl-hint">Click or press Space to reveal</p>}</div>}
          {sl.kind === 'debate' && <div className="sl-debate"><p className="sl-kicker">Move to a corner</p><h1 className="sl-big sm">“{sl.title}”</h1><div className="sl-sides">{sl.sides!.map((x) => <div key={x}>{x}</div>)}</div><ul className="sl-frames">{sl.frames!.map((f) => <li key={f}>{f}</li>)}</ul>{reveal ? <p className="sl-reveal ok">{sl.reveal}</p> : <p className="sl-hint">Click or press Space to reveal what the Church teaches</p>}</div>}
          {sl.kind === 'timer' && <TimerView sl={sl} />}
          {sl.kind === 'exit' && <><h1 className="sl-big sm">{sl.title}</h1><div className="sl-cards exit">{sl.cards!.slice(0, shown).map((c) => <div className="sl-card" key={c.k}><span className="sl-card-k">{c.k}</span><span className="sl-card-v">{c.v}</span></div>)}</div></>}
          {sl.kind === 'prayer' && <blockquote className="sl-prayer"><span className="sl-cross" aria-hidden>✝</span><p>{sl.body}</p></blockquote>}
          {sl.kind === 'end' && <><h1 className="sl-title">{sl.title}</h1><p className="sl-sub">{sl.body}</p></>}
        </div>
      </div>
      {notes && <aside className="sl-notes" aria-label="Teacher notes"><strong>Notes</strong>{sl.notes?.length ? <ul>{sl.notes.map((n) => <li key={n}>{n}</li>)}</ul> : <p className="muted">No notes for this slide.</p>}</aside>}
      <div className="sl-bar"><i style={{ width: `${((i + 1) / slides.length) * 100}%` }} /></div>
      <div className="sl-nav">
        <button className="btn" onClick={back} disabled={i === 0 && shown <= 1}>← Back</button>
        <span aria-live="polite">{i + 1} / {slides.length}</span>
        <button className="btn primary" onClick={next} disabled={i === slides.length - 1 && !reveals && !building}>{reveals ? 'Reveal' : building ? 'Next card' : 'Next →'}</button>
      </div>
      {grid && (
        <div className="sl-grid" role="dialog" aria-label="All slides">
          <div className="sl-grid-head"><strong>All slides</strong><button className="btn small" onClick={() => setGrid(false)}>Close</button></div>
          <div className="sl-grid-body">
            {slides.map((x, n) => (
              <button key={n} className={`sl-thumb sk-${x.kind} th-${x.theme ?? 'creed'}${n === i ? ' cur' : ''}`} onClick={() => { setGrid(false); go(n); }} aria-label={`Slide ${n + 1}: ${x.label}`}>
                <span className="sl-thumb-n">{n + 1}</span>
                <span className="sl-thumb-l">{x.label}</span>
                <span className="sl-thumb-t">{short(x.word?.w ?? x.title ?? x.q?.q ?? x.body ?? '', 70)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
