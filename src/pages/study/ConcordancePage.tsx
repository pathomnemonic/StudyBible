import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { BOOKS } from '../../lib/canon';
import { fold, scriptureIndex } from '../../search/engine';
import { Link } from 'react-router-dom';

interface Hit {
  b: string;
  c: number;
  v: number;
  t: string;
}

/** Concordance: every verse containing a word (exact word, not a prefix) in the chosen translation, counted by book. */
export default function ConcordancePage() {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const [sp, setSp] = useSearchParams();
  const [word, setWord] = useState(sp.get('w') ?? '');
  const [edId, setEdId] = useState(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [openBook, setOpenBook] = useState<string | null>(null);
  const ed = get(edId) ?? editions[0];
  const w = sp.get('w') ?? '';

  useEffect(() => {
    if (!w || !ed) return setHits(null);
    let live = true;
    setBusy(true);
    scriptureIndex(ed).then((idx) => {
      const term = fold(w).trim();
      const res = idx.search(term, { prefix: false, fuzzy: false }) as any[];
      // exact whole-word match only (the index tokenises on non-letters, so this is already exact; re-check for safety)
      const re = new RegExp(`(^|[^a-z0-9'])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9'])`);
      const out = res.filter((r) => re.test(fold(r.t))).map((r) => ({ b: r.b, c: r.c, v: r.v, t: r.t }));
      if (live) {
        setHits(out);
        setBusy(false);
      }
    });
    return () => {
      live = false;
    };
  }, [w, ed?.id]);

  const byBook = useMemo(() => {
    const m = new Map<string, Hit[]>();
    for (const h of hits ?? []) (m.get(h.b) ?? m.set(h.b, []).get(h.b)!).push(h);
    return m;
  }, [hits]);
  const mark = (t: string) => {
    const term = fold(w);
    const f = fold(t);
    const i = f.indexOf(term);
    if (i < 0) return t;
    return <>{t.slice(0, i)}<mark>{t.slice(i, i + term.length)}</mark>{t.slice(i + term.length)}</>;
  };
  const max = Math.max(1, ...[...byBook.values()].map((l) => l.length));
  return (
    <div className="page">
      <h1>Concordance</h1>
      <p className="lede">Find every verse that contains a word, counted by book. Exact words only; use Search for phrases and related forms.</p>
      <form className="search-box" onSubmit={(e) => { e.preventDefault(); setSp(word.trim() ? { w: word.trim() } : {}); }} role="search">
        <input type="search" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. covenant, manna, charity" aria-label="Word" />
        <select value={edId} onChange={(e) => setEdId(e.target.value)} aria-label="Translation">
          {editions.filter((e) => e.language === 'en' && !e.offByDefault).map((e) => <option key={e.id} value={e.id}>{e.shortName}</option>)}
        </select>
        <button className="btn primary" type="submit">Look up</button>
      </form>
      {busy && <p className="muted">Building the word index for {ed?.shortName} (first use only)…</p>}
      {hits && (
        <>
          <p><strong>{hits.length}</strong> verse{hits.length === 1 ? '' : 's'} contain “{w}” in {ed.shortName}.</p>
          <div>
            {BOOKS.filter((b) => byBook.has(b.id)).map((b) => {
              const l = byBook.get(b.id)!;
              return (
                <div key={b.id}>
                  <button className="conc-row" onClick={() => setOpenBook(openBook === b.id ? null : b.id)} aria-expanded={openBook === b.id}>
                    <span className="conc-name">{b.name}</span>
                    <span className="conc-bar"><i style={{ width: `${(100 * l.length) / max}%` }} /></span>
                    <span className="conc-n">{l.length}</span>
                  </button>
                  {openBook === b.id && (
                    <ul className="list">
                      {l.slice(0, 200).map((h) => (
                        <li key={`${h.c}.${h.v}`}>
                          <Link to={`/read/${ed.id}/${h.b}/${h.c}?v=${h.v}`}>{b.name} {h.c}:{h.v}</Link> {mark(h.t)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
