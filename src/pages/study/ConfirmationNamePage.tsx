import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NAME_SAINTS, type NameSaint } from '../../data/confirmationSaints';

interface Q { id: string; ask: string; multi?: boolean; options: { label: string; tags: string[] }[] }
const QUESTIONS: Q[] = [
  { id: 'gift', ask: 'Which would you most like to grow in?', multi: true, options: [
    { label: 'Courage', tags: ['courage'] }, { label: 'Wisdom and learning', tags: ['learning', 'scholar'] }, { label: 'Kindness to others', tags: ['charity', 'mercy'] },
    { label: 'Joy and humor', tags: ['joy', 'humor'] }, { label: 'Prayer and quiet', tags: ['prayer', 'quiet'] }, { label: 'Staying faithful when it is hard', tags: ['perseverance', 'faithful'] } ] },
  { id: 'serve', ask: 'How would you most like to serve?', multi: true, options: [
    { label: 'Helping the poor', tags: ['poor', 'charity'] }, { label: 'Teaching or explaining', tags: ['teach'] }, { label: 'Music, art or making things', tags: ['art', 'creativity'] },
    { label: 'Leading others', tags: ['lead'] }, { label: 'Going out to new places', tags: ['mission'] }, { label: 'At home, in daily life', tags: ['family', 'ordinary', 'work'] } ] },
  { id: 'story', ask: 'What kind of story speaks to you?', multi: true, options: [
    { label: 'A dramatic change of heart', tags: ['conversion'] }, { label: 'Standing up for what is right', tags: ['martyr', 'justice'] }, { label: 'A young person who did great things', tags: ['youth'] },
    { label: 'Forgiving the unforgivable', tags: ['forgiveness'] }, { label: 'Suffering with trust', tags: ['suffering'] }, { label: 'Love of nature', tags: ['nature'] } ] },
  { id: 'who', ask: 'Do you want a saint who is…', options: [
    { label: 'A woman', tags: ['g:f'] }, { label: 'A man', tags: ['g:m'] }, { label: 'Either', tags: [] } ] },
];
const fmt = (md: string) => new Date(Date.UTC(2024, +md.slice(0, 2) - 1, +md.slice(3))).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' });

export function rank(picks: string[], saints: NameSaint[] = NAME_SAINTS): NameSaint[] {
  const want = new Set(picks.filter((t) => !t.startsWith('g:')));
  const g = picks.find((t) => t.startsWith('g:'))?.slice(2);
  return saints
    .filter((s) => !g || s.g === g)
    .map((s) => ({ s, score: s.tags.filter((t) => want.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name))
    .map((x) => x.s);
}

/** A few questions about what you want to grow in, then saints who fit, with their days. For choosing a confirmation name or a patron. */
export default function ConfirmationNamePage() {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [show, setShow] = useState(false);
  const toggle = (q: Q, label: string) => setPicked((p) => { const cur = p[q.id] ?? []; const next = q.multi ? (cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]) : [label]; return { ...p, [q.id]: next }; });
  const tagsOf = (q: Q) => q.options.filter((o) => (picked[q.id] ?? []).includes(o.label)).flatMap((o) => o.tags);
  const allTags = QUESTIONS.flatMap(tagsOf);
  return (
    <div className="page">
      <h1>Choose a saint’s name</h1>
      <p className="lede">Answer a few questions and see saints who might fit. Nothing is saved.</p>
      {QUESTIONS.map((q) => (
        <fieldset key={q.id} className="cq">
          <legend>{q.ask}{q.multi ? ' (pick any)' : ''}</legend>
          <div className="chips">{q.options.map((o) => <button key={o.label} className={`chip${(picked[q.id] ?? []).includes(o.label) ? ' sel' : ''}`} aria-pressed={(picked[q.id] ?? []).includes(o.label)} onClick={() => { toggle(q, o.label); setShow(false); }}>{o.label}</button>)}</div>
        </fieldset>
      ))}
      <button className="btn primary" disabled={!allTags.length} onClick={() => setShow(true)}>Show saints</button>
      {show && (() => { const r = rank(allTags).slice(0, 8); return r.length ? (
        <ul className="list" style={{ marginTop: 12 }}>{r.map((s) => <li key={s.name}><strong>{s.name}</strong> <span className="muted small">· {fmt(s.feast)}</span><br /><span className="small">{s.why}</span></li>)}</ul>
      ) : <p className="muted">No match yet. Try picking more answers.</p>; })()}
      <p className="small"><Link to="/study/saint-names">Look up a saint by name</Link> · <Link to="/my-saints">My saints and days</Link></p>
    </div>
  );
}
