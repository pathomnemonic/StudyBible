import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { BOOKS, GROUPS, getBook } from '../lib/canon';
import { psalmDualLabel } from '../lib/versification';
import type { EditionRecord } from '../data/loader';

export default function BookPicker({
  edition,
  current,
  onPick,
  onClose,
}: {
  edition: EditionRecord;
  current: string;
  onPick: (book: string, chapter: number) => void;
  onClose: () => void;
}) {
  const [book, setBook] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const chapters = book ? edition.chapters[book] : 0;
  const filtered = q.trim()
    ? BOOKS.filter((b) => (b.name + ' ' + (b.douayName ?? '') + ' ' + b.abbr).toLowerCase().includes(q.trim().toLowerCase()))
    : null;
  return (
    <Modal title={book ? getBook(book).name : 'Choose a book'} onClose={onClose}>
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
          <div className="picker-ways" aria-label="Other ways to read">
            <Link to="/listen" onClick={onClose}>Bible in a Year</Link>
            <Link to="/pray/plans" onClick={onClose}>Reading plans</Link>
            <Link to="/pray/readings" onClick={onClose}>Mass readings</Link>
            <Link to="/study/paths" onClick={onClose}>Study paths</Link>
            <Link to="/study/fathers" onClick={onClose}>Reading room</Link>
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
