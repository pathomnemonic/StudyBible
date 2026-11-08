import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { getGrade, flatLessons, gradeLabel, progressId, toggleDone, type GradeData } from '../curriculum/model';
import { PRAYERS } from '../data/prayers';
import { loadDaily, pickDaily } from '../study/daily';
import { liturgicalDay, parseIso } from '../liturgy/compute';
import { uid, today } from './model';
import { GRADE_IDS, addDaysIso, buildPlan, checksKey, gradeForAge, loadFamily, mondayOf, nextLesson, planText, saveFamily, weekDates, weekNumber, type Kid, type PlanItem } from './parent';

/** True once the kids' questions page is in the app; the plan links to it only then. */
const KIDS_QUESTIONS = true;
const label = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function KidForm({ onAdd }: { onAdd: (k: Kid) => void }) {
  const [name, setName] = useState(''), [age, setAge] = useState(''), [grade, setGrade] = useState(''), [goals, setGoals] = useState('');
  const g = grade || (age && +age > 0 ? gradeForAge(+age) : '');
  return (
    <form className="live-form pm-form" onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !g) return; onAdd({ id: uid(), name: name.trim(), age: age ? +age : undefined, grade: g, goals: goals.trim() || undefined }); setName(''); setAge(''); setGrade(''); setGoals(''); }}>
      <label>Child’s name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Maria" /></label>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <label>Age (optional)<input type="number" min={3} max={18} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: 90 }} /></label>
        <label>Grade<select value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">{age ? `By age: ${gradeLabel(gradeForAge(+age))}` : 'Choose a grade'}</option>{GRADE_IDS.map((id) => <option key={id} value={id}>{gradeLabel(id)}</option>)}</select></label>
      </div>
      <label>Hopes for their faith (optional)<input value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Getting ready for First Communion" /></label>
      <button className="btn primary" disabled={!name.trim() || !g}>Add child</button>
    </form>
  );
}

export default function ParentPage() {
  const [s] = useSettings();
  const [fam, setFam] = useState(loadFamily);
  const [monday, setMonday] = useState(() => mondayOf(today()));
  const [grades, setGrades] = useState<Record<string, GradeData | null>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saint, setSaint] = useState<{ who: string; text: string } | null>(null);
  const [copied, setCopied] = useState('');
  const progress = useLiveQuery(() => db.planProgress.toArray(), []) ?? [];
  const update = (kids: Kid[]) => { setFam({ kids }); saveFamily({ kids }); };

  const gradeIds = [...new Set(fam.kids.map((k) => k.grade))].join(',');
  useEffect(() => { let live = true; Promise.all(gradeIds.split(',').filter(Boolean).map(async (g) => [g, (await getGrade(g)) ?? null] as const)).then((r) => live && setGrades((o) => ({ ...o, ...Object.fromEntries(r) }))); return () => { live = false; }; }, [gradeIds]);
  useEffect(() => { try { setChecks(JSON.parse(localStorage.getItem(checksKey(monday)) ?? '{}')); } catch { setChecks({}); } }, [monday]);
  const saintDate = addDaysIso(monday, 1);
  useEffect(() => { let live = true; loadDaily().then((f) => { if (!f || !live) return; const e = pickDaily(f, liturgicalDay(parseIso(saintDate), s.diocese === 'US' ? 'usa' : 'universal')); setSaint(e ? { who: e.saint.who, text: e.saint.text } : null); }).catch(() => setSaint(null)); return () => { live = false; }; }, [saintDate, s.diocese]);

  const doneOf = (g: string) => progress.find((p) => p.planId === progressId(g))?.done ?? [];
  const days = useMemo(() => buildPlan({
    monday,
    kids: fam.kids.map((kid) => {
      const gd = grades[kid.grade]; const flat = gd ? flatLessons(gd) : [];
      const idx = gd ? nextLesson(flat.length, progress.find((p) => p.planId === progressId(kid.grade))?.done ?? []) : null;
      const l = idx === null ? null : flat[idx];
      return { kid, grade: kid.grade, index: idx, lesson: l ? { id: l.id, title: l.title, question: l.question, activity: l.activity, life: l.life } : null };
    }),
    saint, prayer: PRAYERS[weekNumber(monday) % PRAYERS.length], kidsQuestionRoute: KIDS_QUESTIONS,
  }), [monday, fam, grades, progress, saint]);

  const isOn = (it: PlanItem) => (it.kind === 'lesson' && it.lessonIndex !== undefined && it.grade ? doneOf(it.grade).includes(it.lessonIndex) : !!checks[it.id]);
  const flip = (it: PlanItem) => {
    if (it.kind === 'lesson' && it.lessonIndex !== undefined && it.grade) { void toggleDone(it.grade, it.lessonIndex, !isOn(it)); return; }
    const n = { ...checks, [it.id]: !checks[it.id] }; setChecks(n); try { localStorage.setItem(checksKey(monday), JSON.stringify(n)); } catch { /* storage unavailable */ }
  };
  const text = planText(days, fam.kids, monday);
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'Our week', text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); setCopied('Copied. Paste it into a message.'); } catch { setCopied('Select the text and copy it.'); }
  };
  const dates = weekDates(monday);

  return (
    <div className="page pm-page">
      <Link to="/teach" className="small no-print">← Teacher tools</Link>
      <h1>Family week plan</h1>
      <p className="lede no-print">Tell us about your children and get one lesson each from their grade’s catechism program, plus a prayer, a saint and the Sunday Gospel for the whole family. Kept on this device only. No account.</p>

      <section className="no-print">
        <h2 className="eyebrow-h">Your children</h2>
        {fam.kids.length === 0 && <div className="empty">No children added yet.</div>}
        <ul className="list pm-kids">{fam.kids.map((k) => (
          <li key={k.id} className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span><strong>{k.name}</strong> <span className="muted small">· {gradeLabel(k.grade)}{k.age ? `, age ${k.age}` : ''}{k.goals ? ` · ${k.goals}` : ''}</span></span>
            <span className="row" style={{ gap: 6 }}>
              <select aria-label={`Grade for ${k.name}`} value={k.grade} onChange={(e) => update(fam.kids.map((x) => (x.id === k.id ? { ...x, grade: e.target.value } : x)))}>{[...GRADE_IDS, 'YA'].map((id) => <option key={id} value={id}>{gradeLabel(id)}</option>)}</select>
              <button className="btn small ghost" onClick={() => confirm(`Remove ${k.name}?`) && update(fam.kids.filter((x) => x.id !== k.id))}>Remove</button>
            </span>
          </li>))}</ul>
        <details open={fam.kids.length === 0}><summary>Add a child</summary><KidForm onAdd={(k) => update([...fam.kids, k])} /></details>
      </section>

      {fam.kids.length > 0 && <>
        <div className="row between no-print" style={{ gap: 8, flexWrap: 'wrap', margin: '16px 0 6px' }}>
          <div className="row" style={{ gap: 6, alignItems: 'center' }}>
            <button className="btn small" onClick={() => setMonday(addDaysIso(monday, -7))} aria-label="Earlier week">‹</button>
            <strong>Week of {label(monday)}</strong>
            <button className="btn small" onClick={() => setMonday(addDaysIso(monday, 7))} aria-label="Later week">›</button>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <button className="btn small primary" onClick={() => window.print()} aria-label="Print the plan or save it as a PDF">Print</button>
            <button className="btn small" onClick={share}>Share as text</button>
          </div>
        </div>
        <p className="muted small no-print" aria-live="polite">{copied || 'Checking a lesson marks it done in the catechism program for that grade, so the lesson page shows it too.'}</p>
        <h2 className="pm-print-title print-only">Our week of {label(monday)}: {fam.kids.map((k) => k.name).join(', ')}</h2>
        <div className="pm-grid" role="list">
          {days.map((d, i) => (
            <section key={d.date} className={`pm-day${i === 6 ? ' sun' : ''}`} role="listitem" aria-label={d.name}>
              <h3>{d.name} <small>{label(dates[i])}</small></h3>
              {d.items.length === 0 && <p className="muted small">A free day.</p>}
              <ul>{d.items.map((it) => (
                <li key={it.id}>
                  <label className="pm-item"><input type="checkbox" checked={isOn(it)} onChange={() => flip(it)} /><span>{it.to ? <Link to={it.to}>{it.text}</Link> : it.text}{it.detail && <em className="pm-detail">{it.detail}</em>}</span></label>
                </li>))}</ul>
            </section>))}
        </div>
        {fam.kids.some((k) => k.goals) && <p className="muted small pm-goals">{fam.kids.filter((k) => k.goals).map((k) => `${k.name}: ${k.goals}`).join(' · ')}</p>}
        <details className="no-print" style={{ marginTop: 12 }}><summary>Plain text to send or paste</summary><textarea readOnly rows={12} style={{ width: '100%' }} value={text} onFocus={(e) => e.currentTarget.select()} aria-label="The plan as plain text" /></details>
      </>}
    </div>
  );
}
