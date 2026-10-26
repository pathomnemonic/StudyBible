import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GradeData, LessonSpec } from '../curriculum/model';
import { live } from './client';
import { useClasses } from '../teach/store';
import { today } from '../teach/model';
import { DEFAULT_SETTINGS, pick, questionsFor, toContent, type Difficulty, type Scope } from './bank';
import type { LiveSettings, LiveSlide } from './types';

interface Props {
  grade: GradeData;
  lesson: LessonSpec & { unit: GradeData['units'][number] };
  slides: LiveSlide[];
  onClose: () => void;
}

/** The teacher's setup for a live class: what to cover, how hard, how many questions, and the room's settings. */
export default function StartLive({ grade, lesson, slides, onClose }: Props) {
  const nav = useNavigate();
  const [scope, setScope] = useState<Scope>('lesson');
  const [count, setCount] = useState(10);
  const [diff, setDiff] = useState<Difficulty>(grade.band === 'primary' ? 'easy' : 'mixed');
  const [withSlides, setWithSlides] = useState(true);
  const [time, setTime] = useState(1);
  const [st, setSt] = useState<LiveSettings>(DEFAULT_SETTINGS);
  const classes = useClasses() ?? [];
  const [classId, setClassId] = useState(() => { try { return localStorage.getItem('sb:teach:last') ?? ''; } catch { return ''; } });
  const cls = classes.find((c) => c.id === classId);
  const [kind, setKind] = useState<'game' | 'lesson' | 'exam'>('game');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (p: Partial<LiveSettings>) => setSt({ ...st, ...p });
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const lessons = scope === 'lesson' ? [lesson] : scope === 'unit' ? lesson.unit.lessons : grade.units.flatMap((u) => u.lessons);
      const all = await questionsFor(grade, lessons);
      const qs = kind === 'lesson' ? [] : pick(all, count, diff);
      if (!qs.length && kind !== 'lesson') throw new Error('There are no questions for that choice.');
      const title = scope === 'lesson' ? lesson.title : scope === 'unit' ? `Unit ${lesson.unit.n}: ${lesson.unit.title}` : `${grade.name} review`;
      const c = await live.create(toContent(title, qs, kind !== 'exam' && (kind === 'lesson' || withSlides) && scope === 'lesson' ? slides : [], time), { ...st, mode: kind === 'exam' ? 'exam' : 'game' }, cls && cls.students.length ? cls.students.map((x) => x.name) : undefined);
      if (cls) { try { localStorage.setItem(`sb:live:meta:${c.code}`, JSON.stringify({ classId: cls.id, title, mode: kind, date: today() })); localStorage.setItem('sb:teach:last', cls.id); } catch { /* storage unavailable */ } }
      try { localStorage.setItem(`sb:live:host:${c.code}`, c.hostKey); } catch { /* storage unavailable */ }
      nav(`/host/${c.code}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <div className="live-setup card" role="dialog" aria-label="Start a live class">
      <div className="row between"><h2 style={{ margin: 0 }}>Start a live class</h2><button className="btn small" onClick={onClose}>Close</button></div>
      <p className="muted small">Your students open the app, choose <strong>Join a class</strong> and type the code you will see. They follow the lesson together on their own screens, then play the quiz. Needs the Study Bible server.</p>
      <div className="live-form" style={{ maxWidth: 'none' }}>
        <label>What kind of session<select value={kind} onChange={(e) => setKind(e.target.value as 'game')}><option value="game">Lesson and quiz game (everyone together)</option><option value="lesson">Lesson only: go through the slides together</option><option value="exam">Exam: each student works alone against the clock</option></select></label>
        <label>Class (to keep attendance and scores)<select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">No class: students type any name</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.students.length} students)</option>)}</select></label>
        {cls && !cls.students.length && <p className="notice warn small">This class has no students yet. Add them under Teacher tools first, or students will have to be matched later.</p>}
        {cls && cls.students.length > 0 && <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.rosterOnly} onChange={(e) => set({ rosterOnly: e.target.checked })} /> Students pick their own name from the class list (attendance is recorded automatically)</label>}
        {kind === 'exam' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><label>Minutes<select value={st.examMinutes} onChange={(e) => set({ examMinutes: +e.target.value })}>{[10, 15, 20, 30, 45, 60, 90].map((n) => <option key={n}>{n}</option>)}</select></label><label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.showResults} onChange={(e) => set({ showResults: e.target.checked })} /> Show students their score</label><label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.showAnswers} onChange={(e) => set({ showAnswers: e.target.checked })} /> and the right answers</label></div>}
        <label>Questions from<select value={scope} onChange={(e) => setScope(e.target.value as Scope)}><option value="lesson">This lesson</option><option value="unit">The whole unit: {lesson.unit.title}</option><option value="grade">The whole grade (a review game)</option></select></label>
        {kind !== 'lesson' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <label>How many<select value={count} onChange={(e) => setCount(+e.target.value)}>{[5, 8, 10, 15, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label>Difficulty<select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}><option value="easy">Easier</option><option value="mixed">Mixed</option><option value="hard">Harder</option></select></label>
          <label>Time<select value={time} onChange={(e) => setTime(+e.target.value)}><option value={0.7}>Quick</option><option value={1}>Normal</option><option value={1.6}>Extra time</option></select></label>
        </div>}
        {kind === 'game' && scope === 'lesson' && slides.length > 0 && <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={withSlides} onChange={(e) => setWithSlides(e.target.checked)} /> Go through the lesson slides together first</label>}
        {kind !== 'exam' && <label>Teams<select value={st.teams} onChange={(e) => set({ teams: +e.target.value })}><option value={0}>No teams (everyone for themselves)</option>{[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>}
        <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.shuffleQuestions} onChange={(e) => set({ shuffleQuestions: e.target.checked })} /> Mix up the order of the questions</label>
        <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.shuffleOptions} onChange={(e) => set({ shuffleOptions: e.target.checked })} /> Mix up the answer choices</label>
        <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.lateJoin} onChange={(e) => set({ lateJoin: e.target.checked })} /> Let students join after it has started</label>
        <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.showNames} onChange={(e) => set({ showNames: e.target.checked })} /> Students can see each other’s names</label>
        {err && <div className="notice warn" role="alert">{err}</div>}
        <button className="btn primary big" onClick={go} disabled={busy}>{busy ? 'Starting…' : 'Open the room'}</button>
      </div>
    </div>
  );
}
