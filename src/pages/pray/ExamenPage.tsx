import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';

/** The five steps of the daily Examen in the Ignatian tradition. Nothing is stored unless you choose to save the reflection. */
const STEPS = [
  { title: 'Become aware of God’s presence', prompt: 'Slow down. Ask the Holy Spirit to help you look back over the day with honesty and without fear. God is here, and loves you.', write: false },
  { title: 'Give thanks', prompt: 'Look through the day for gifts: people, small moments, things that went well, things you did not earn. Thank God for them one by one.', write: true, label: 'What I am thankful for' },
  { title: 'Review the day', prompt: 'Walk through the day hour by hour. Where did you notice love, patience, peace or joy? Where did you feel pulled away from God or from others?', write: true, label: 'What I noticed' },
  { title: 'Face what went wrong', prompt: 'Name any failures, sins or missed chances, plainly and without excusing or despairing. Ask forgiveness, and if it is serious sin, plan to go to Confession.', write: true, label: 'What I am sorry for' },
  { title: 'Look to tomorrow', prompt: 'Ask for the grace you need for tomorrow, and make one small, concrete resolution. Close with an Our Father.', write: true, label: 'My intention for tomorrow' },
];

const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };

export default function ExamenPage() {
  const [i, setI] = useState(0);
  const [text, setText] = useState<string[]>(STEPS.map(() => ''));
  const [saved, setSaved] = useState(false);
  const step = STEPS[i];
  const any = text.some((t) => t.trim());
  const save = async () => {
    const body = STEPS.map((s, k) => (text[k].trim() ? `**${(s as any).label ?? s.title}**\n${text[k].trim()}` : '')).filter(Boolean).join('\n\n');
    await db.journal.add({ date: today(), kind: 'journal', title: 'Examen', body, refs: [], createdAt: Date.now(), updatedAt: Date.now() });
    setSaved(true);
  };
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>The daily Examen</h1>
      <p className="lede">A few quiet minutes at the end of the day. Nothing you write here is saved unless you choose to keep it.</p>
      <div className="progress" aria-hidden><div style={{ width: `${(100 * (i + 1)) / STEPS.length}%` }} /></div>
      <p className="muted small">Step {i + 1} of {STEPS.length}</p>
      <section className="card" aria-live="polite">
        <h2 className="card-title">{step.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{step.prompt}</p>
        {step.write && <textarea value={text[i]} onChange={(e) => setText(text.map((t, k) => (k === i ? e.target.value : t)))} placeholder={(step as any).label} aria-label={(step as any).label} rows={5} />}
      </section>
      <div className="row between" style={{ marginTop: 12 }}>
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < STEPS.length - 1 ? <button className="btn primary" onClick={() => setI(i + 1)}>Next</button> : (
          <span className="row" style={{ gap: 6 }}>
            {any && !saved && <button className="btn" onClick={save}>Save to my journal</button>}
            {saved && <span className="muted small">Saved to your journal.</span>}
            <Link className="btn primary" to="/pray">Amen</Link>
          </span>
        )}
      </div>
    </div>
  );
}
