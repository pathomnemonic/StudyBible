import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { BOOKS } from '../../lib/canon';
import { getBookText } from '../../data/loader';
import { flattenChapter } from '../../lib/bibleText';
import { countWords, fingerprint, type Fingerprint } from '../../lib/fingerprint';

/** a spread of books of different kinds, to say what is ordinary for the Bible */
const BASE = ['GEN', 'PSA', 'ISA', 'MAT', 'JHN', 'ACT', 'ROM', 'REV'];
const textsOf = async (ed: string, id: string) => (await getBookText(ed, id)).chapters.flatMap((ch) => flattenChapter(ch).map((v) => v.text));

/** Book fingerprint: the words a book leans on, from the Bible text on this device. Tap a word to see every verse that uses it. */
export default function FingerprintPage() {
  const { book = 'JHN' } = useParams();
  const nav = useNavigate();
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition === 'vulgate' ? 'webc' : s.defaultEdition) ?? editions[0];
  const meta = BOOKS.find((b) => b.id === book) ?? BOOKS.find((b) => b.id === 'JHN')!;
  const [fp, setFp] = useState<Fingerprint | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!ed) return;
    let live = true;
    setFp(null); setErr('');
    (async () => {
      const mine = countWords(await textsOf(ed.id, meta.id));
      const others = BASE.filter((b) => b !== meta.id);
      const base = countWords((await Promise.all(others.map((b) => textsOf(ed.id, b)))).flat());
      if (live) setFp(fingerprint(mine, base));
    })().catch(() => live && setErr('This book’s text is not on this device yet. Save the Bible for offline use in Downloads, or connect and try again.'));
    return () => { live = false; };
  }, [ed?.id, meta.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const max = useMemo(() => Math.max(1, ...(fp?.frequent.map((f) => f.n) ?? [1])), [fp]);
  const w = (word: string) => `/study/concordance?w=${encodeURIComponent(word)}`;
  return (
    <div className="page">
      <h1>Book fingerprint</h1>
      <p className="lede">The words a book leans on. Counted from {ed?.name ?? 'the Bible'} on this device; common small words are left out. Tap a word to see every verse that uses it.</p>
      <label className="stack"><span>Book</span>
        <select value={meta.id} onChange={(e) => nav(`/study/fingerprint/${e.target.value}`)} aria-label="Book">{BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
      </label>
      {err && <p className="notice" role="alert">{err}</p>}
      {!fp && !err && <div className="skeleton-list" aria-busy="true" role="status" aria-label="Counting words"><i /><i /><i /></div>}
      {fp && (
        <>
          <section className="card">
            <h2 className="card-title">Most used in {meta.name}</h2>
            <p className="muted small">{fp.total.toLocaleString()} counted words.</p>
            <ol className="fp-list">
              {fp.frequent.map((f) => (
                <li key={f.word}><Link to={w(f.word)}>{f.word}</Link><span className="fp-bar" aria-hidden="true"><i style={{ width: `${Math.round((100 * f.n) / max)}%` }} /></span><span className="muted small">{f.n}</span></li>
              ))}
            </ol>
          </section>
          <section className="card">
            <h2 className="card-title">What sets {meta.name} apart</h2>
            <p className="muted small">Words it uses much more than a spread of other books (Genesis, Psalms, Isaiah, Matthew, John, Acts, Romans and Revelation) do, with how many times more.</p>
            <ul className="chips">
              {fp.distinctive.map((f) => <li key={f.word}><Link className="chip" to={w(f.word)} title={`${f.n} times`}>{f.word} <span className="muted small">×{f.times >= 100 ? '100+' : Math.round(f.times)}</span></Link></li>)}
            </ul>
          </section>
          <p className="muted small">Counting is by exact word, not meaning. Names and common words can crowd the results; the Concordance shows the verses behind each one.</p>
        </>
      )}
    </div>
  );
}
