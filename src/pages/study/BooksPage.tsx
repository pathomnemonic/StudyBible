import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOOK_BY_ID, GROUPS } from '../../lib/canon';
import { getBooksInfo, refsFromText, type BookInfo } from '../../study/refData';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import RefLink from '../../components/RefLink';
import { readerPath } from '../../lib/nav';

/** Book introductions and outlines (editorial, written for this app). */
export default function BooksPage() {
  const { id } = useParams();
  const [info, setInfo] = useState<Record<string, BookInfo> | null>(null);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  useEffect(() => {
    getBooksInfo().then(setInfo);
  }, []);
  const ed = get(s.defaultEdition) ?? editions[0];
  const book = id ? BOOK_BY_ID[id] : null;
  if (!book)
    return (
      <div className="page">
        <h1>Books of the Bible</h1>
        <p className="lede">An introduction and outline for each of the 73 books.</p>
        {GROUPS.map((g) => (
          <section key={g.name}>
            <h2 style={{ fontSize: '1.1rem' }}>{g.name}</h2>
            <div className="chips" style={{ flexWrap: 'wrap' }}>
              {g.books.map((b) => (
                <Link key={b.id} className="chip" to={`/study/books/${b.id}`}>{b.name}</Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  const b = info?.[book.id];
  const first = refsFromText(`${book.name} 1`)[0];
  return (
    <div className="page">
      <p className="small"><Link to="/study/books">← All books</Link></p>
      <h1>{book.name}</h1>
      {!info && <p className="muted">Loading…</p>}
      {b && (
        <>
          <p className="lede">{b.intro}</p>
          <p className="muted small">
            {b.author && <>Author: {b.author}. </>}
            {b.date && <>Date: {b.date}. </>}
            This introduction and outline were written for this app as a study aid and are not an official Church text; see the commentary and the Church’s teaching for authoritative guidance.
          </p>
          <div className="card">
            <h2 className="card-title">Outline</h2>
            <ol className="list" style={{ paddingLeft: 20 }}>
              {b.outline.map(([range, title]) => (
                <li key={range + title}>
                  <strong>{title}</strong> <span className="muted small">{range}</span>{' '}
                  {refsFromText(`${book.name} ${range}`)[0] && <RefLink refv={refsFromText(`${book.name} ${range}`)[0]}>read</RefLink>}
                </li>
              ))}
            </ol>
          </div>
          {first && ed && <p><Link className="btn primary" to={readerPath(ed, first)}>Read {book.name}</Link></p>}
        </>
      )}
    </div>
  );
}
