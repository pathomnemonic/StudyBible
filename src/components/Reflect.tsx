import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import Icon from './Icon';

/** The day's question, with a pen to write an answer. The answer is kept in the prayer journal, one entry per day. */
export default function Reflect({ date, question, refId }: { date: string; question: string; refId?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const existing = useLiveQuery(() => db.journal.where('date').equals(date).filter((e) => e.kind === 'journal' && e.title === question).first(), [date, question]);
  useEffect(() => { setText(existing?.body ?? ''); setSaved(false); }, [existing?.id, date, question]);
  const save = async () => {
    const body = text.trim();
    if (!body) return;
    const now = Date.now();
    if (existing?.id) await db.journal.put({ ...existing, body, updatedAt: now });
    else await db.journal.add({ date, kind: 'journal', title: question, body, refs: refId ? [refId] : [], createdAt: now, updatedAt: now });
    setSaved(true);
  };
  return (
    <div className="reflect">
      <p className="home-question">
        {question}
        <button className="icon-btn reflect-pen" onClick={() => setOpen((x) => !x)} aria-expanded={open} aria-label={existing ? 'Edit your reflection' : 'Write a reflection'} title="Write your answer">
          <Icon name="pen" />{existing && <span className="reflect-dot" aria-hidden />}
        </button>
      </p>
      {open && (
        <div className="reflect-box">
          <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} placeholder="Your answer, only for you…" rows={4} aria-label="Your reflection" autoFocus />
          <div className="row">
            <button className="btn primary small" onClick={save} disabled={!text.trim()}>{saved ? 'Saved' : 'Save'}</button>
            <Link to="/pray/journal" className="small">Open journal</Link>
          </div>
        </div>
      )}
    </div>
  );
}
