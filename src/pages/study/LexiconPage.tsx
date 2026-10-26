import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadLexicon, loadText, NT_BOOKS, type LexEntry, type Lang } from '../../study/original';
import { BOOKS } from '../../lib/canon';
import { convertRef } from '../../lib/versification';
import { readerPath } from '../../lib/nav';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import FilterBar from '../../components/FilterBar';
import { fold } from '../../search/engine';

type Row = { id: string; e: LexEntry };
const OT = BOOKS.filter((b) => b.testament === 'OT').map((b) => b.id);
const NT = BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id);
const bookName = (id: string) => BOOKS.find((b) => b.id === id)?.name ?? id;

/** Greek and Hebrew words, looked up by meaning, sound or Strong’s number, with where each one occurs in the text. */
export default function LexiconPage() {
  const [lang, setLang] = useState<Lang>('grc');
  const [q, setQ] = useState('');
  const [lex, setLex] = useState<Record<string, LexEntry> | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { setLex(null); setSel(null); loadLexicon(lang).then((l) => setLex(l ?? {})); }, [lang]);
  const rows = useMemo<Row[]>(() => {
    if (!lex) return [];
    const t = fold(q.trim());
    if (t.length < 2) return [];
    const num = /^[gh]?(\d{1,5})$/i.exec(q.trim());
    if (num) return lex[num[1]] ? [{ id: num[1], e: lex[num[1]] }] : [];
    const out: Row[] = [];
    for (const [id, e] of Object.entries(lex)) {
      const hay = fold(`${e[0]} ${e[1]} ${e[2]} ${e[3]}`);
      if (hay.includes(t)) out.push({ id, e });
      if (out.length >= 60) break;
    }
    // words whose gloss or sound starts with the term come first
    return out.sort((a, b) => Number(fold(b.e[2]).startsWith(t) || fold(b.e[1]).startsWith(t)) - Number(fold(a.e[2]).startsWith(t) || fold(a.e[1]).startsWith(t)));
  }, [lex, q]);
  return (
    <div className="page lexicon">
      <h1>Greek and Hebrew words</h1>
      <p className="lede">Look a word up by its English meaning, by how it sounds, or by Strong’s number (G26, H157). Then see every place it appears.</p>
      <div className="tabbar" role="tablist" aria-label="Language"><button role="tab" aria-selected={lang === 'grc'} onClick={() => setLang('grc')}>Greek (New Testament)</button><button role="tab" aria-selected={lang === 'hbo'} onClick={() => setLang('hbo')}>Hebrew (Old Testament)</button></div>
      <FilterBar active={0} search={<input type="search" value={q} onChange={(e) => { setQ(e.target.value); setSel(null); }} placeholder={lang === 'grc' ? 'love, agape, G26…' : 'covenant, hesed, H2617…'} aria-label="Find a word" />}>
        <p className="muted small" style={{ margin: 0 }}>Entries are from Strong’s lexicon (public domain). Meanings are brief; the study panel’s Words tab shows each word in its verse.</p>
      </FilterBar>
      {!lex && <p className="muted">Loading the lexicon…</p>}
      {lex && q.trim().length >= 2 && rows.length === 0 && <p className="muted">No word matches “{q}”.</p>}
      <ul className="lex-list">
        {rows.map(({ id, e }) => (
          <li key={id}>
            <button className={`lex-row${sel === id ? ' on' : ''}`} onClick={() => setSel(sel === id ? null : id)} aria-expanded={sel === id}>
              <span className="lex-lemma" lang={lang === 'grc' ? 'el' : 'he'}>{e[0]}</span>
              <span className="lex-main"><strong>{e[1]}</strong><span className="muted small">{lang === 'grc' ? 'G' : 'H'}{id} · {e[2].replace(/[{}]/g, '').slice(0, 90)}</span></span>
              <span className="coll-chev" aria-hidden="true" style={{ transform: sel === id ? 'rotate(180deg)' : undefined }}>▾</span>
            </button>
            {sel === id && <Entry id={id} e={e} lang={lang} />}
          </li>
        ))}
      </ul>
      {lex && q.trim().length < 2 && <p className="muted">Try <button className="linklike" onClick={() => setQ('love')}>love</button>, <button className="linklike" onClick={() => setQ('peace')}>peace</button>, <button className="linklike" onClick={() => setQ(lang === 'grc' ? 'G26' : 'H2617')}>{lang === 'grc' ? 'G26' : 'H2617'}</button> or <button className="linklike" onClick={() => setQ('spirit')}>spirit</button>.</p>}
      <p className="muted small">Related: <Link to="/study/concordance">Concordance</Link> (every English word) · <Link to="/study/terms">Key words and phrases</Link></p>
    </div>
  );
}

function Entry({ id, e, lang }: { id: string; e: LexEntry; lang: Lang }) {
  const { editions } = useEditions();
  const [s] = useSettings();
  const ed = editions.find((x) => x.id === s.defaultEdition) ?? editions[0];
  const [found, setFound] = useState<{ total: number; by: [string, number][]; refs: { book: string; c: number; v: number }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const find = async () => {
    setBusy(true);
    const books = lang === 'grc' ? NT : OT;
    const by: [string, number][] = [];
    const refs: { book: string; c: number; v: number }[] = [];
    let total = 0;
    for (const b of books) {
      const t = await loadText(lang, b);
      if (!t) continue;
      let n = 0;
      t.forEach((ch, ci) => ch.forEach((vs, vi) => { const hit = vs.filter((w) => w[1] === id).length; if (hit) { n += hit; if (refs.length < 40) refs.push({ book: b, c: ci + 1, v: vi + 1 }); } }));
      if (n) by.push([b, n]);
      total += n;
    }
    setFound({ total, by, refs });
    setBusy(false);
  };
  const link = (r: { book: string; c: number; v: number }) => {
    if (!ed) return '/read';
    const a = convertRef('kjv', 'vulgate', { book: r.book, c1: r.c, c2: r.c, v1: r.v, v2: r.v }).ref;
    return readerPath(ed, a);
  };
  return (
    <div className="lex-entry">
      <p className="lex-big" lang={lang === 'grc' ? 'el' : 'he'}>{e[0]} <span>{e[1]}</span></p>
      <p><strong>Meaning.</strong> {e[2].replace(/[{}]/g, '')}</p>
      {e[3] && <p><strong>Rendered in the KJV as.</strong> {e[3]}</p>}
      {e[4] && <p className="muted small"><strong>Origin.</strong> {e[4]}</p>}
      {!found && <button className="btn small" onClick={find} disabled={busy}>{busy ? 'Looking through the text…' : `Find every place ${lang === 'grc' ? 'in the New Testament' : 'in the Old Testament'}`}</button>}
      {found && (
        <div>
          <p><strong>{found.total.toLocaleString()}</strong> {found.total === 1 ? 'time' : 'times'}{found.by.length ? `, in ${found.by.length} book${found.by.length === 1 ? '' : 's'}` : ''}.</p>
          <div className="chips">{found.by.slice(0, 20).map(([b, n]) => <span key={b} className="chip">{bookName(b)} {n}</span>)}</div>
          {found.refs.length > 0 && <p className="small">First {found.refs.length}: {found.refs.map((r) => <Link key={`${r.book}${r.c}${r.v}`} to={link(r)} style={{ marginRight: 8 }}>{bookName(r.book)} {r.c}:{r.v}</Link>)}</p>}
        </div>
      )}
    </div>
  );
}
