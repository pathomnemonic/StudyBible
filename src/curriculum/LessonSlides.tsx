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

type Kind = 'title' | 'wonder' | 'idea' | 'goals' | 'vocab' | 'story' | 'scripture' | 'image' | 'church' | 'video' | 'points' | 'talk' | 'do' | 'saint' | 'quiz' | 'life' | 'prayer' | 'end';
interface Slide { kind: Kind; label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string; credit: string }; video?: Video; q?: Question; notes?: string[]; word?: { w: string; d: string } }

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
  s.push({ kind: 'title', label: `${gradeLabel(grade.id)} · Unit ${lesson.unit.n}`, title: lesson.title, body: lesson.unit.title, notes: [`Essential question: ${lesson.unit.eq}`, `Plan about ${band.minutes} minutes. Start with the opening prayer.`] });
  s.push({ kind: 'wonder', label: 'Let’s wonder', title: lesson.question, notes: ['Ask before you teach. Collect two or three answers, and write them where everyone can see.', ...band.plan.slice(1, 2).map((p) => p[2])] });
  s.push({ kind: 'idea', label: 'The big idea', title: lesson.idea, notes: lesson.teach?.slice(0, 1) });
  const words = lesson.vocab.filter((v) => gl[v]);
  s.push({ kind: 'goals', label: 'Today we will', items: [`Learn: ${short(lesson.idea, 110)}`, ...(words.length ? [`Use new words: ${words.slice(0, 4).map((v) => gl[v].w).join(', ')}`] : []), `Hear God’s word: ${lesson.scripture.split(';')[0]}`, `Pray${prayer ? `: ${prayer.title}` : ''}`] });
  for (const v of words) s.push({ kind: 'vocab', label: 'Word to know', word: gl[v], notes: ['Say the word, have everyone repeat it, then read the meaning. Ask for an example from life.'] });
  if (story) for (const c of chunk(story, younger ? 230 : 320)) s.push({ kind: 'story', label: 'The story', body: c, notes: ['Read this slowly. Pause after each slide and ask, “What do you notice?”'] });
  for (const p of passages) {
    const text = p.verses.map((v) => `${v.v} ${v.text}`).join(' ');
    const pieces = chunk(text, younger ? 260 : 380);
    pieces.forEach((c, i) => s.push({ kind: 'scripture', label: 'Scripture', body: c, ref: `${p.label}${pieces.length > 1 ? ` (${i + 1}/${pieces.length})` : ''}`, notes: i === 0 ? ['Read it aloud twice. The second time, ask students to listen for one word or phrase.'] : undefined }));
  }
  art.slice(0, 2).forEach((x) => s.push({ kind: 'image', label: 'Look', img: { src: base + x.file, alt: x.title, credit: `${x.title}, ${x.artist}` }, notes: ['Ask: What do you see? What is happening? What does the artist want us to notice?'] }));
  if (!younger) ccc.slice(0, 3).forEach((p) => s.push({ kind: 'church', label: `What the Church teaches · Catechism §${p.n}`, body: short(p.t, 460), notes: ['The Church’s own words. Read aloud and put it in your own words.'] }));
  else if (ccc[0]) s.push({ kind: 'church', label: 'What the Church teaches', body: lesson.idea, notes: [`For you: Catechism §${lesson.ccc.split(',')[0]} says: ${short(ccc[0].t, 300)}`] });
  if (videos[0]) s.push({ kind: 'video', label: 'Watch', video: videos[0], notes: ['Watch it yourself first. It is a creator’s video, not part of this program. Pause to ask questions.'] });
  if ((grade.band === 'high' || grade.band === 'adult' || grade.band === 'middle') && lesson.teach?.length) s.push({ kind: 'points', label: 'Key points', items: lesson.teach.map((t) => short(t, 190)), notes: ['These are your talking points. Put the main ideas in your own voice.'] });
  (lesson.talk ?? []).forEach((q, i) => s.push({ kind: 'talk', label: `Talk about it · ${i + 1}`, title: q, notes: ['Think, pair, share: a minute alone, a minute with a partner, then a few share.'] }));
  s.push({ kind: 'do', label: 'Let’s do it', title: lesson.activity, notes: lesson.misc?.length ? [`Listen for: ${lesson.misc.join(' · ')}`] : undefined });
  if (lesson.saint) { const i = lesson.saint.indexOf(':'); s.push({ kind: 'saint', label: 'A saint who lived this', title: i > 0 ? lesson.saint.slice(0, i) : lesson.saint, body: i > 0 ? lesson.saint.slice(i + 1).trim() : '' }); }
  quiz.forEach((q, i) => s.push({ kind: 'quiz', label: `Check · ${i + 1} of ${quiz.length}`, q, notes: ['Let students answer before you reveal. Ask why.'] }));
  if (lesson.life) s.push({ kind: 'life', label: 'This week', title: lesson.life });
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
  const next = () => { const sl = slides[i]; if (sl.kind === 'quiz' && !reveal) setReveal(true); else go(i + 1); };
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
          {sl.kind === 'prayer' && <blockquote className="sl-prayer"><p>{sl.body}</p></blockquote>}
          {sl.kind === 'end' && <><h1 className="sl-title">{sl.title}</h1><p className="sl-sub">{sl.body}</p></>}
        </div>
      </div>
      {notes && <aside className="sl-notes" aria-label="Teacher notes"><strong>Notes</strong>{sl.notes?.length ? <ul>{sl.notes.map((n) => <li key={n}>{n}</li>)}</ul> : <p className="muted">No notes for this slide.</p>}</aside>}
      <div className="sl-bar"><i style={{ width: `${((i + 1) / slides.length) * 100}%` }} /></div>
      <div className="sl-nav">
        <button className="btn" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
        <span aria-live="polite">{i + 1} / {slides.length}</span>
        <button className="btn primary" onClick={next} disabled={i === slides.length - 1 && !(sl.kind === 'quiz' && !reveal)}>{sl.kind === 'quiz' && !reveal ? 'Reveal' : 'Next →'}</button>
      </div>
    </div>,
    document.body,
  );
}
