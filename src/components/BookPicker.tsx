import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { BOOKS, GROUPS, getBook } from '../lib/canon';
import { psalmDualLabel } from '../lib/versification';
import type { EditionRecord } from '../data/loader';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { recentPassages } from '../lib/readerPosition';

export default function BookPicker({
  edition,
  current,
  onPick,
  onClose,
  here,
  onRecent,
}: {
  edition: EditionRecord;
  current: string;
  onPick: (book: string, chapter: number) => void;
  onClose: () => void;
  /** the settings of this reading (translation, find, compare), shown above the list of books */
  here?: ReactNode;
  /** open a recently read chapter (anchor reference id such as JHN.3) */
  onRecent?: (ref: string) => void;
}) {
  const recent = useLiveQuery(async () => recentPassages(await db.history.orderBy('ts').reverse().limit(120).toArray(), 8), []) ?? [];
  const [book, setBook] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const chapters = book ? edition.chapters[book] : 0;
  const filtered = q.trim()
    ? BOOKS.filter((b) => (b.name + ' ' + (b.douayName ?? '') + ' ' + b.abbr).toLowerCase().includes(q.trim().toLowerCase()))
    : null;
  return (
    <Modal title={book ? getBook(book).name : 'Books and translation'} onClose={onClose}>
      {book ? (
        <>
          <button className="btn small ghost" onClick={() => setBook(null)}>
            ← All books
          </button>
          {getBook(book).note && <p className="notice info">{getBook(book).note}</p>}
          <div className="picker-ch">
            {Array.from({ length: chapters }, (_, i) => i + 1).map((c) => (
              <button key={c} onClick={() => onPick(book, c)} title={book === 'PSA' && edition.scheme === 'vulgate' ? psalmDualLabel(c) && `Hebrew/English ${psalmDualLabel(c)}` : undefined}>
                {c}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {here}
          {onRecent && (
            <section className="recent-passages" aria-label="Recently read">
              <h3 className="eyebrow-h">Recently read</h3>
              {recent.length === 0 ? <p className="muted small">Nothing yet. The chapters you read will be listed here.</p> : (
                <div className="chips">{recent.map((r) => <button key={r.ref} className="chip" onClick={() => onRecent(r.ref)}>{r.label}</button>)}</div>
              )}
            </section>
          )}
          <div className="picker-ways" aria-label="Other ways to read">
            <Link to="/listen" onClick={onClose}>Bible in a Year</Link>
            <Link to="/pray/readings" onClick={onClose}>Mass readings</Link>
            <Link to="/study/paths" onClick={onClose}>Study paths</Link>
            <Link to="/room" onClick={onClose}>Read tab</Link>
          </div>
          <input type="search" placeholder="Filter books…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', marginBottom: 10 }} aria-label="Filter books" />
          {(filtered ? [{ name: 'Matches', books: filtered }] : GROUPS).map((g) => (
            <div key={g.name} style={{ marginBottom: 12 }}>
              <div className="muted small" style={{ margin: '6px 0' }}>
                {g.name}
              </div>
              <div className="picker-books">
                {g.books.map((b) => (
                  <button
                    key={b.id}
                    className={b.deutero ? 'deu' : ''}
                    aria-current={b.id === current}
                    style={b.id === current ? { borderColor: 'var(--accent)' } : undefined}
                    onClick={() => (b.chapters === 1 ? onPick(b.id, 1) : setBook(b.id))}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="muted small">† Deuterocanonical book (or a book with deuterocanonical additions). All 73 books of the Catholic canon are listed in the traditional order.</p>
        </>
      )}
    </Modal>
  );
}
