import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gradeLabel, type GradeData, type LessonSpec } from './model';
import type { Band } from './pedagogy';

type L = LessonSpec & { unit: GradeData['units'][number] };
interface Seg { name: string; minutes: number; guide: string; say: string[]; ask: string[]; need: string[] }

const clean = (t: string) => t.replace(/\s*\((?:see )?(?:CCC|Catechism)\s*[^)]*\)/gi, '').trim();

/** Builds the lesson's running order from the age band's plan and the lesson's own parts, so a teacher can run it without planning anything. */
export function segmentsFor(lesson: L, band: Band, o: { prayer?: string; scripture?: string; minutes?: number }): Seg[] {
  const total = o.minutes ?? band.minutes;
  return band.plan.map(([name, share, guide]) => {
    const n = name.toLowerCase();
    const seg: Seg = { name, minutes: Math.max(2, Math.round(total * share)), guide, say: [], ask: [], need: [] };
    if (/gather|welcome/.test(n)) {
      seg.say = ['Begin with the Sign of the Cross.', o.prayer ? 'Pray together: ' + o.prayer.split(/(?<=[.!?])\s/).slice(0, 2).join(' ') : 'Pray an Our Father or a short prayer of your own.'];
      seg.ask = ['What do you remember from last time?'];
    } else if (/hook|engage|launch|frame|real question/.test(n)) {
      seg.say = [lesson.hook ?? lesson.question];
      seg.ask = [lesson.question, ...(lesson.misc?.[0] ? [`Listen for this idea: “${lesson.misc[0].replace(/^[“"]|[”"]$/g, '')}”`] : [])];
    } else if (/pray with scripture/.test(n)) {
      seg.say = [`Read ${lesson.scripture.split(';')[0]} aloud twice, slowly.`, 'Keep two minutes of silence.'];
      seg.ask = ['Which word or phrase stood out for you?'];
      seg.need = [lesson.scripture.split(';')[0]];
    } else if (/teach|tell|story/.test(n)) {
      seg.say = [clean(lesson.idea), ...(lesson.teach ?? []).slice(0, 3).map(clean)];
      seg.ask = ['Who can say that in your own words?'];
      seg.need = [`Scripture: ${lesson.scripture}`, `Catechism §${lesson.ccc}`];
    } else if (/practice|do it|work on|workshop|seminar|discuss/.test(n)) {
      seg.say = [lesson.activity];
      seg.ask = lesson.talk?.length ? lesson.talk.slice(0, 3) : [lesson.question];
      if (lesson.misc?.length) seg.need = ['Listen for: ' + lesson.misc.slice(0, 2).join(' · ')];
    } else {
      seg.say = [...(lesson.life ? [`This week: ${lesson.life}`] : []), ...(lesson.mem ? [`Learn by heart: ${lesson.mem}`] : []), 'Close with the lesson’s prayer, then the Sign of the Cross.'];
      seg.ask = [lesson.assess ?? 'Tell me one thing you will remember.'];
    }
    return seg;
  });
}

const fmt = (s: number) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;

/** "Lesson in a box": the whole lesson as one timed running order, with what to say and ask at each step, one tap to start. */
export default function LessonRun({ lesson, grade, band, prayer, scripture, onSlides, onClose }: { lesson: L; grade: GradeData; band: Band; prayer?: string; scripture?: string; onSlides: () => void; onClose: () => void }) {
  const [mins, setMins] = useState(band.minutes);
  const segs = useMemo(() => segmentsFor(lesson, band, { prayer, scripture, minutes: mins }), [lesson, band, prayer, scripture, mins]);
  const [i, setI] = useState(-1);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const start = (n: number) => { setI(n); if (segs[n]) setLeft(segs[n].minutes * 60); setRunning(true); };
  useEffect(() => { root.current?.focus(); }, [i]);
  useEffect(() => {
    if (i < 0 || !running) return;
    const t = window.setInterval(() => setLeft((x) => x - 1), 1000);
    return () => window.clearInterval(t);
  }, [i, running]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (i < segs.length) start(i + 1); }
      else if (e.key === 'ArrowLeft' && i > 0) start(i - 1);
      else if (e.key === ' ' && i >= 0) { e.preventDefault(); setRunning((r) => !r); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const seg = segs[i];
  const over = left < 0;
  const totalSecs = segs.reduce((a, s) => a + s.minutes * 60, 0);
  const doneSecs = segs.slice(0, Math.max(0, i)).reduce((a, s) => a + s.minutes * 60, 0) + (seg ? seg.minutes * 60 - Math.max(0, left) : 0);
  return createPortal(
    <div className="run-layer" role="dialog" aria-modal="true" aria-label="Run this lesson" ref={root} tabIndex={-1}>
      <header className="run-top">
        <div><strong>{lesson.title}</strong><span className="muted small"> · {gradeLabel(grade.id)} · {mins} min</span></div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn small" onClick={onSlides}>▶ Slides</button>
          <button className="btn small" onClick={onClose}>Close</button>
        </div>
      </header>
      <div className="run-bar" aria-hidden><i style={{ width: `${Math.min(100, (doneSecs / totalSecs) * 100)}%` }} /></div>
      <div className="run-body">
        {i < 0 && <section className="run-card">
          <h2>Ready to teach?</h2>
          <p className="muted">{lesson.idea}</p>
          <label className="run-len">Class length
            <select value={mins} onChange={(e) => setMins(+e.target.value)} aria-label="Class length in minutes">{[20, 30, 40, 45, 50, 60, 75, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select>
          </label>
          <h3>Have ready</h3>
          <ul>
            <li>The Bible at {lesson.scripture}</li>
            <li>Slides open on a screen (tap ▶ Slides), or this page</li>
            <li>For the activity: {lesson.activity.slice(0, 120)}{lesson.activity.length > 120 ? '…' : ''}</li>
          </ul>
          <ol className="run-order">{segs.map((s) => <li key={s.name}><span>{s.name}</span><span className="muted">{s.minutes} min</span></li>)}</ol>
          <button className="btn primary big" onClick={() => start(0)}>Start the lesson</button>
        </section>}
        {seg && <section className="run-card" aria-live="polite">
          <p className="run-step">Step {i + 1} of {segs.length}</p>
          <h2>{seg.name}</h2>
          <div className={`run-clock${over ? ' over' : left < 60 ? ' low' : ''}`} aria-label={over ? 'over time' : 'time left'}>{over ? '+' : ''}{fmt(left)}</div>
          <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
            <button className="btn small" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Resume'}</button>
            <button className="btn small" onClick={() => setLeft((x) => x + 60)}>+1 min</button>
          </div>
          {seg.say.length > 0 && <><h3>Say or do</h3><ul>{seg.say.map((t) => <li key={t}>{t}</li>)}</ul></>}
          {seg.ask.length > 0 && <><h3>Ask</h3><ul>{seg.ask.map((t) => <li key={t}>{t}</li>)}</ul></>}
          {seg.need.length > 0 && <><h3>Keep at hand</h3><ul>{seg.need.map((t) => <li key={t}>{t}</li>)}</ul></>}
          <p className="muted small">{seg.guide}</p>
        </section>}
        {i >= segs.length && <section className="run-card"><h2>Lesson complete</h2><p>Make the Sign of the Cross together. Thanks be to God.</p><p className="muted">Send home the family sheet and mark this lesson done.</p><button className="btn primary" onClick={onClose}>Finish</button></section>}
      </div>
      {i >= 0 && i < segs.length && <footer className="run-foot">
        <button className="btn" disabled={i === 0} onClick={() => start(i - 1)}>← Back</button>
        <button className="btn primary big" onClick={() => start(i + 1)}>{i === segs.length - 1 ? 'Finish lesson' : `Next: ${segs[i + 1].name} →`}</button>
      </footer>}
    </div>,
    document.body,
  );
}
