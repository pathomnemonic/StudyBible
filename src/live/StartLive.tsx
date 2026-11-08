import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GradeData, LessonSpec } from '../curriculum/model';
import { createHost } from './link';
import { useClasses } from '../teach/store';
import { today, type ClassDoc } from '../teach/model';
import { loadTriviaBank } from '../lib/triviaBank';
import { bonusFor, toBank, topicOf } from '../curriculum/bonusTrivia';
import { DEFAULT_SETTINGS, pick, questionsFor, toContent, type Difficulty, type Scope } from './bank';
import type { LiveSettings, LiveSlide } from './types';


export interface RoomOpts {
  grade: GradeData; lesson: LessonSpec & { unit: GradeData['units'][number] };
  scope: Scope; kind: 'game' | 'standing' | 'race' | 'build' | 'lesson' | 'exam'; count: number; diff: Difficulty; time: number;
  st: LiveSettings; withSlides: boolean; slides: LiveSlide[]; cls?: ClassDoc; bonus?: number;
}
/** Make the room and remember what it was about; resolves with the join code. Shared by the setup form and the one-tap quick quiz. */
export async function openRoom(o: RoomOpts): Promise<string> {
  const { grade, lesson, scope, kind, cls } = o;
  const lessons = scope === 'lesson' ? [lesson] : scope === 'unit' ? lesson.unit.lessons : grade.units.flatMap((u) => u.lessons);
  const all = await questionsFor(grade, lessons);
  let qs = kind === 'lesson' ? [] : pick(all, o.count, o.diff);
  if (!qs.length && kind !== 'lesson') throw new Error('There are no questions for that choice.');
  // which lesson each question came from, so the teacher dashboard can say what to teach again
  const owner: Record<string, string> = {};
  if (qs.length) for (const l of lessons) for (const q of await questionsFor(grade, [l])) if (!owner[q.q]) owner[q.q] = l.id;
  if (o.bonus && kind !== 'lesson' && scope === 'lesson') {
    const extra = bonusFor(await loadTriviaBank(), topicOf(lesson), o.bonus).map(({ q }) => toBank(q));
    for (const q of extra) owner[q.q] = lesson.id;
    qs = [...qs, ...extra];
  }
  const title = scope === 'lesson' ? lesson.title : scope === 'unit' ? `Unit ${lesson.unit.n}: ${lesson.unit.title}` : `${grade.name} review`;
  const c = await createHost(toContent(title, qs, (kind === 'game' || kind === 'standing' || kind === 'lesson') && (kind === 'lesson' || o.withSlides) && scope === 'lesson' ? o.slides : [], o.time), { ...o.st, mode: kind === 'exam' ? 'exam' : kind === 'race' ? 'race' : kind === 'build' ? 'build' : 'game', elimination: kind === 'standing' }, cls && cls.students.length ? cls.students.map((x) => x.name) : []);
  try {
    localStorage.setItem(`sb:teach:lesson:${c.code}`, JSON.stringify({ g: grade.id, lessons: [...new Set(Object.values(owner).concat(scope === 'lesson' ? [lesson.id] : []))], owner }));
    if (cls) { localStorage.setItem(`sb:live:meta:${c.code}`, JSON.stringify({ classId: cls.id, title, mode: kind === 'lesson' ? 'lesson' : kind === 'exam' ? 'exam' : 'game', date: today() })); localStorage.setItem('sb:teach:last', cls.id); }
  } catch { /* storage unavailable */ }
  return c.code;
}

/** One tap from a lesson: a mixed 8-question quiz from the lesson's own bank, no slides, no class, straight to the host screen with the join code. */
export function QuickQuizButton({ grade, lesson, className = 'btn small' }: { grade: GradeData; lesson: LessonSpec & { unit: GradeData['units'][number] }; className?: string }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <>
      <button className={className} disabled={busy} title="Opens a live room at once with 8 mixed questions from this lesson. Students join with the code." onClick={async () => {
        setBusy(true); setErr('');
        try { nav(`/host/${await openRoom({ grade, lesson, scope: 'lesson', kind: 'game', count: 8, diff: 'mixed', time: 1, st: { ...DEFAULT_SETTINGS, rosterOnly: false }, withSlides: false, slides: [] })}`); } catch (e) { setErr((e as Error).message); setBusy(false); }
      }}>{busy ? '⚡ Opening…' : '⚡ Quick quiz now'}</button>
      {err && <span role="alert" className="small" style={{ color: '#b3261e' }}>{err}</span>}
    </>
  );
}

interface Props {
  grade: GradeData;
  lesson: LessonSpec & { unit: GradeData['units'][number] };
  slides: LiveSlide[];
  onClose: () => void;
}

/** The teacher's setup for a live class: what to cover, how hard, how many questions, and the room's settings. */
export default function StartLive({ grade, lesson, slides, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, []);
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
  const [kind, setKind] = useState<'game' | 'standing' | 'race' | 'build' | 'lesson' | 'exam'>('game');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (p: Partial<LiveSettings>) => setSt({ ...st, ...p });
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const code = await openRoom({ grade, lesson, scope, kind, count, diff, time, st, withSlides, slides, cls, bonus: bonusOn ? bonusN : 0 });
      nav(`/host/${code}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  const [bonusOn, setBonusOn] = useState(false);
  const [bonusN, setBonusN] = useState(3);
  const [bonusFound, setBonusFound] = useState<number | null>(null);
  useEffect(() => {
    if (!bonusOn) return;
    let live = true;
    loadTriviaBank().then((bank) => live && setBonusFound(bonusFor(bank, topicOf(lesson), 40).length)).catch(() => live && setBonusFound(0));
    return () => { live = false; };
  }, [bonusOn, lesson.id]);
  return (
    <div className="live-setup card" role="region" aria-label="Start a live class" ref={box}>
      <div className="row between"><h2 style={{ margin: 0 }}>Start a live class</h2><button className="btn small" onClick={onClose}>Close</button></div>
      <p className="muted small">Your students open the app, choose <strong>Join a class</strong> and type the code you will see. They follow the lesson together on their own screens, then play the quiz. No account is needed.</p>
      <div className="live-form" style={{ maxWidth: 'none' }}>
        <label>What kind of session<select value={kind} onChange={(e) => setKind(e.target.value as 'game')}><optgroup label="Games"><option value="game">Pilgrim Quiz: lesson, then a quiz everyone plays together</option><option value="standing">Last Saint Standing: a wrong answer puts you out</option><option value="race">Pilgrim’s Road: race to the church at your own pace</option><option value="build">Build the Cathedral: the whole class builds it together</option></optgroup><optgroup label="Teaching"><option value="lesson">Lesson only: go through the slides together</option><option value="exam">Exam: each student works alone against the clock</option></optgroup></select></label>
        <label>Class (to keep attendance and scores)<select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">No class: students type any name</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.students.length} students)</option>)}</select></label>
        {cls && !cls.students.length && <p className="notice warn small">This class has no students yet. Add them under Teacher tools first, or students will have to be matched later.</p>}
        {cls && cls.students.length > 0 && <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.rosterOnly} onChange={(e) => set({ rosterOnly: e.target.checked })} /> Students pick their own name from the class list (attendance is recorded automatically)</label>}
        {(kind === 'race' || kind === 'build') && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><label>Minutes<select value={st.runMinutes} onChange={(e) => set({ runMinutes: +e.target.value })}>{[3, 5, 8, 10, 15, 20].map((n) => <option key={n}>{n}</option>)}</select></label><label>{kind === 'race' ? 'Steps to the church' : 'Stones to finish'}<select value={st.goal} onChange={(e) => set({ goal: +e.target.value })}>{(kind === 'race' ? [6, 10, 12, 15, 20] : [20, 30, 40, 60, 80, 120]).map((n) => <option key={n}>{n}</option>)}</select></label></div>}
        {kind === 'exam' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><label>Minutes<select value={st.examMinutes} onChange={(e) => set({ examMinutes: +e.target.value })}>{[10, 15, 20, 30, 45, 60, 90].map((n) => <option key={n}>{n}</option>)}</select></label><label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.showResults} onChange={(e) => set({ showResults: e.target.checked })} /> Show students their score</label><label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={st.showAnswers} onChange={(e) => set({ showAnswers: e.target.checked })} /> and the right answers</label></div>}
        <label>Questions from<select value={scope} onChange={(e) => setScope(e.target.value as Scope)}><option value="lesson">This lesson</option><option value="unit">The whole unit: {lesson.unit.title}</option><option value="grade">The whole grade (a review game)</option></select></label>
        {kind !== 'lesson' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <label>How many<select value={count} onChange={(e) => setCount(+e.target.value)}>{[5, 8, 10, 15, 20, 30, 40].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label>Difficulty<select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}><option value="easy">Easier</option><option value="mixed">Mixed</option><option value="hard">Harder</option></select></label>
          <label>Time<select value={time} onChange={(e) => setTime(+e.target.value)}><option value={0.7}>Quick</option><option value={1}>Normal</option><option value={1.6}>Extra time</option></select></label>
        </div>}
        {(kind === 'game' || kind === 'standing') && scope === 'lesson' && slides.length > 0 && <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={withSlides} onChange={(e) => setWithSlides(e.target.checked)} /> Go through the lesson slides together first</label>}
        {kind !== 'lesson' && scope === 'lesson' && <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={bonusOn} onChange={(e) => setBonusOn(e.target.checked)} /> Add bonus questions from the trivia bank</label>
          {bonusOn && <label className="row" style={{ gap: 6, fontWeight: 400 }}>Up to <select aria-label="How many bonus questions" value={bonusN} onChange={(e) => setBonusN(+e.target.value)}>{[2, 3, 5, 8].map((n) => <option key={n}>{n}</option>)}</select></label>}
          {bonusOn && <span className="muted small" aria-live="polite">{bonusFound === null ? 'Looking…' : bonusFound ? `${bonusFound} fit this lesson, from the Crown Quest bank.` : 'None in the Crown Quest bank fit this lesson closely, so none will be added.'}</span>}
        </div>}
        {(kind === 'game' || kind === 'standing' || kind === 'build') && <label>Teams<select value={st.teams} onChange={(e) => set({ teams: +e.target.value })}><option value={0}>No teams (everyone for themselves)</option>{[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>}
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
