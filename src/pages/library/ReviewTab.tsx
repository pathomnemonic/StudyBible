import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '../../db/db';
import AddToCollection from '../../components/AddToCollection';
import { formatRef, parseRefId } from '../../lib/refs';

const WEEK = 7 * 864e5;
const title = (n: Note) => (n.title || n.body.split('\n')[0] || 'Untitled').slice(0, 90);
const ANSWERED = 'answered';

/** Question inbox (open and answered questions, with a way to look each up) and a weekly review of what you did. Everything is read from your own notes and highlights on this device. */
export default function ReviewTab() {
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const highlights = useLiveQuery(() => db.highlights.toArray(), []) ?? [];
  const since = Date.now() - WEEK;
  const questions = notes.filter((n) => n.kind === 'question').sort((a, b) => b.updatedAt - a.updatedAt);
  const open = questions.filter((n) => !n.tags.includes(ANSWERED));
  const answered = questions.filter((n) => n.tags.includes(ANSWERED));
  const wrote = notes.filter((n) => n.createdAt >= since && n.kind !== 'question').sort((a, b) => b.createdAt - a.createdAt);
  const asked = questions.filter((n) => n.createdAt >= since);
  const lit = highlights.filter((h) => h.createdAt >= since);
  const due = notes.filter((n) => n.revisitAt && n.revisitAt <= Date.now());
  const mark = (n: Note, done: boolean) => db.notes.put({ ...n, tags: done ? [...n.tags, ANSWERED] : n.tags.filter((t) => t !== ANSWERED), updatedAt: Date.now() });
  return (
    <>
      <section className="card" aria-label="Question inbox">
        <h2 className="card-title">Question inbox</h2>
        <p className="muted small">Every note you wrote as a question. Tick one as answered when you have your answer; “Look it up” opens the Catechism search with the question filled in.</p>
        {questions.length === 0 && <p className="muted">No questions yet. Write one with “Ask a question” in Notes, or from any passage.</p>}
        {open.length > 0 && <h3>Still open ({open.length})</h3>}
        <ul className="list">
          {open.map((n) => (
            <li key={n.id} className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span>{title(n)}</span>
              <span className="row" style={{ gap: 6 }}>
                <Link className="btn small ghost" to={`/study/ask?q=${encodeURIComponent(n.body.slice(0, 200))}`}>Look it up</Link>
                <Link className="btn small ghost" to={`/library/notes/${n.id}`}>Open</Link>
                <button className="btn small" onClick={() => void mark(n, true)}>Mark answered</button>
              </span>
            </li>
          ))}
        </ul>
        {answered.length > 0 && (
          <details><summary>Answered ({answered.length})</summary>
            <ul className="list">{answered.map((n) => <li key={n.id} className="row between"><span>{title(n)}</span><span className="row" style={{ gap: 6 }}><Link className="btn small ghost" to={`/library/notes/${n.id}`}>Open</Link><button className="btn small" onClick={() => void mark(n, false)}>Reopen</button></span></li>)}</ul>
          </details>
        )}
      </section>

      <section className="card" aria-label="Weekly review">
        <h2 className="card-title">This week</h2>
        <p className="muted small">The last seven days, from your own notes and highlights. Nothing leaves this device.</p>
        <p><strong>{wrote.length}</strong> {wrote.length === 1 ? 'note' : 'notes'} written, <strong>{lit.length}</strong> {lit.length === 1 ? 'highlight' : 'highlights'} made, <strong>{asked.length}</strong> {asked.length === 1 ? 'question' : 'questions'} asked, <strong>{open.length}</strong> still open.</p>
        {wrote.length > 0 && <><h3>Notes</h3><ul className="list">{wrote.slice(0, 8).map((n) => <li key={n.id}><Link to={`/library/notes/${n.id}`}>{title(n)}</Link></li>)}</ul></>}
        {lit.length > 0 && <><h3>Highlights</h3><ul className="list">{lit.slice(0, 8).map((h) => { const r = parseRefId(h.ref); return <li key={h.id}>{r ? formatRef(r) : h.ref} ({h.color})</li>; })}</ul></>}
        {due.length > 0 && <><h3>Notes you chose to come back to</h3><ul className="list">{due.slice(0, 8).map((n) => <li key={n.id} className="row between" style={{ gap: 8, flexWrap: 'wrap' }}><Link to={`/library/notes/${n.id}`}>{title(n)}</Link><span className="row" style={{ gap: 6 }}><button className="btn small" onClick={() => void db.notes.put({ ...n, revisitAt: undefined, updatedAt: Date.now() })}>Reviewed</button><button className="btn small ghost" onClick={() => void db.notes.put({ ...n, revisitAt: Date.now() + WEEK, updatedAt: Date.now() })}>Next week</button>{n.uid && <AddToCollection target={{ type: 'note', uid: n.uid, label: title(n) }} label="＋ Collection" />}</span></li>)}</ul></>}
        {wrote.length + lit.length + asked.length === 0 && <p className="muted">Nothing yet this week. A highlight or a short note is enough to start.</p>}
      </section>
    </>
  );
}
