import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPauline, refsFromText, type PaulineLetter } from '../../study/refData';
import RefLink from '../../components/RefLink';
import { BOOK_BY_ID } from '../../lib/canon';

/** Argument outlines of the Pauline letters (editorial). */
export default function PaulinePage() {
  const [sp, setSp] = useSearchParams();
  const [letters, setLetters] = useState<Record<string, PaulineLetter> | null>(null);
  useEffect(() => {
    getPauline().then((d) => setLetters(d?.letters ?? null));
  }, []);
  const id = sp.get('l') ?? 'ROM';
  const l = letters?.[id];
  return (
    <div className="page">
      <h1>Paul’s letters: argument outlines</h1>
      <div className="chips" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {letters && Object.entries(letters).map(([k, v]) => (
          <button key={k} className={`chip${k === id ? ' sel' : ''}`} onClick={() => setSp({ l: k })}>{v.name}</button>
        ))}
      </div>
      {l && (
        <>
          <p className="lede">{l.theme}</p>
          <p className="muted small">{l.date}. Outline written for this app as a study aid; see <Link to={`/study/books/${id}`}>the book page</Link> and the commentary for fuller treatment.</p>
          <ol className="list" style={{ paddingLeft: 20 }}>
            {l.sections.map(([range, title, argument]) => {
              const r = refsFromText(`${BOOK_BY_ID[id].name} ${range}`)[0];
              return (
                <li key={range} style={{ marginBottom: 10 }}>
                  <strong>{title}</strong> <span className="muted small">{range}</span> {r && <RefLink refv={r}>read</RefLink>}
                  <div>{argument}</div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
