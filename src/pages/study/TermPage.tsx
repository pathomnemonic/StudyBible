import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadTerm, loadTerms, type TermBrief, type TermFull } from '../../study/terms';
import { getBook } from '../../lib/canon';
import { BOOKS } from '../../lib/canon';
import { parseRefId, parseRefs, formatRef } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { passageText } from '../../lib/bibleText';
import { readerPath } from '../../lib/nav';
import { useEditions } from '../../data/EditionsContext';

/** The key-words index. */
export function TermsIndex() {
  const [terms, setTerms] = useState<TermBrief[]>([]);
  useEffect(() => { loadTerms().then(setTerms); }, []);
  const groups: [string, string][] = [['title', 'Titles of Christ'], ['phrase', 'Phrases'], ['word', 'Words'], ['name', 'Names'], ['place', 'Places'], ['object', 'Objects']];
  return (
    <div className="page">
      <h1>Key words and phrases</h1>
      <p className="lede">The words that carry the most weight in Scripture. In the reader they sparkle softly; tap one to learn what it means and where else it appears. You can turn the sparkles off in Reading settings.</p>
      {groups.map(([k, label]) => {
        const list = terms.filter((t) => t.kind === k);
        if (!list.length) return null;
        return (
          <section key={k}>
            <h2 className="h-sm">{label}</h2>
            <ul className="term-list">
              {list.map((t) => (
                <li key={t.id}>
                  <Link to={`/study/term/${t.id}`}><strong>{t.title}</strong> <span className="muted small">{t.total} verses</span></Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** One key word or phrase: what it means, the passages that matter, and every place it occurs. */
export default function TermPage() {
  const { id = '' } = useParams();
  const [t, setT] = useState<TermFull | null | undefined>(undefined);
  const [all, setAll] = useState<TermBrief[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const { get, editions } = useEditions();
  const ed = get('dra') ?? editions[0];
  useEffect(() => {
    setT(undefined);
    setShowAll(false);
    loadTerm(id).then((x) => setT(x ?? null));
    loadTerms().then(setAll);
  }, [id]);
  useEffect(() => {
    if (!t || !ed) return;
    let live = true;
    (async () => {
      const out: Record<string, string> = {};
      for (const p of t.passages) {
        const ps = parseRefs(p.ref);
        if (!ps.ok) continue;
        const anchor = convertRef('kjv', 'vulgate', ps.refs[0].ref).ref;
        const vs = await passageText(ed, anchor, 3).catch(() => []);
        out[p.ref] = vs.map((v) => v.text).join(' ');
      }
      if (live) setTexts(out);
    })();
    return () => { live = false; };
  }, [t?.id, ed?.id]);
  if (t === undefined) return <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>;
  if (!t) return <div className="page"><p>That term was not found. <Link to="/study/terms">All key words</Link></p></div>;
  const rows = BOOKS.map((b) => ({ b, n: t.byBook[b.id] ?? 0 })).filter((r) => r.n);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const verses = (showAll ? t.verses : t.verses.slice(0, 40)).map((v) => parseRefId(v)).filter(Boolean);
  return (
    <div className="page">
      <nav className="crumbs"><Link to="/study/terms">← Key words</Link></nav>
      <h1>{t.title}</h1>
      <p className="lede">{t.gist}</p>
      <p className="small"><strong>In the original languages:</strong> {t.original}</p>

      <h2 className="h-sm">Passages that matter</h2>
      <ul className="term-passages">
        {t.passages.map((p) => {
          const ps = parseRefs(p.ref);
          const anchor = ps.ok ? convertRef('kjv', 'vulgate', ps.refs[0].ref).ref : null;
          return (
            <li key={p.ref} className="card">
              <div className="row between">
                <strong>{anchor ? <Link to={readerPath(ed, anchor)}>{p.ref}</Link> : p.ref}</strong>
                <span className="muted small">{p.note}</span>
              </div>
              {texts[p.ref] && <blockquote className="fq-block"><p>{texts[p.ref]}</p><footer>{ed.shortName}</footer></blockquote>}
            </li>
          );
        })}
      </ul>

      <h2 className="h-sm">Where it appears ({t.total} verses in the Douay-Rheims)</h2>
      <div className="wordjourney" role="list">
        {rows.map((r) => {
          const first = t.verses.map((v) => parseRefId(v)).find((x) => x && x.book === r.b.id);
          return (
            <Link key={r.b.id} role="listitem" className="wj-row" to={first ? readerPath(ed, first) : '#'}>
              <span className="wj-name">{getBook(r.b.id).name}</span>
              <span className="wj-bar"><i style={{ width: `${Math.max(3, (r.n / max) * 100)}%` }} /></span>
              <span className="wj-n">{r.n}</span>
            </Link>
          );
        })}
      </div>
      <details open style={{ marginTop: 12 }}>
        <summary>Verses</summary>
        <p className="chips">{verses.map((r) => r && <Link key={formatRef(r)} className="chip" to={readerPath(ed, r)}>{formatRef(r, { noDual: true })}</Link>)}</p>
        {t.verses.length > 40 && !showAll && <button className="btn small" onClick={() => setShowAll(true)}>Show {Math.min(600, t.verses.length) - 40} more</button>}
      </details>
      <p className="muted small">Occurrences are found by matching the wording of the Douay-Rheims, so another translation may use the phrase in other places. A few verses that only look similar can be included.</p>

      {t.related.length > 0 && (
        <>
          <h2 className="h-sm">Related</h2>
          <p className="chips">{t.related.map((r) => <Link key={r} className="chip" to={`/study/term/${r}`}>{all.find((x) => x.id === r)?.title ?? r}</Link>)}</p>
        </>
      )}
    </div>
  );
}
