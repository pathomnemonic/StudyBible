import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLibScripture, getLibraryIndex, type LibraryWorkMeta, type LibScriptureEntry } from '../../data/content';
import { parseRefs, formatRef, refId, type Ref } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { Cited } from '../../study/citations';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { passageText } from '../../lib/bibleText';

const STOP = new Set('that this with from have they them were will shall unto thou thee thy thine which when what there their these those been being into upon than then also your yours hath doth said saith'.split(' '));
const sig = (t: string) => new Set((t.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w)));

const words = (t: string) => (t.match(/\S+/g) ?? []).length;
const overlaps = (e: LibScriptureEntry, r: Ref) => {
  if (e[2] < (r.c1) || e[0] > (r.c2)) return false;
  const a = e[0] * 1000 + (e[1] || 0), b = e[2] * 1000 + (e[3] || 999);
  const x = r.c1 * 1000 + (r.v1 ?? 0), y = r.c2 * 1000 + (r.v2 ?? 999);
  return a <= y && b >= x;
};

/** Everywhere the Fathers and saints in the library quote or comment on a verse, ranked by how much they say about it. */
export default function QuotationTracker() {
  const [sp, setSp] = useSearchParams();
  const [text, setText] = useState(sp.get('ref') ?? 'John 6:51');
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [rows, setRows] = useState<LibScriptureEntry[] | null>(null);
  const [err, setErr] = useState('');
  const { get, editions } = useEditions();
  const [settings] = useSettings();
  const [verseWords, setVerseWords] = useState<Set<string>>(new Set());
  const [min, setMin] = useState<'all' | 'cites' | 'long'>('cites');
  useEffect(() => { getLibraryIndex().then((l) => setWorks(l?.works ?? [])); }, []);
  const parsed = useMemo(() => {
    const p = parseRefs(sp.get('ref') ?? '');
    return p.ok ? convertRef('kjv', 'vulgate', p.refs[0].ref).ref : null;
  }, [sp]);
  useEffect(() => {
    if (!parsed) { setRows(null); return; }
    let live = true;
    setRows(null);
    getLibScripture(parsed.book).then((all) => live && setRows((all ?? []).filter((e) => overlaps(e, parsed)))).catch(() => live && setErr('The index could not be loaded.'));
    return () => { live = false; };
  }, [parsed && refId(parsed)]);
  useEffect(() => {
    const ed = get(settings.defaultEdition) ?? editions[0];
    if (!parsed || !ed) return;
    passageText(ed, parsed, 6).then((vs) => setVerseWords(sig(vs.map((v) => v.text).join(' '))));
  }, [parsed && refId(parsed), settings.defaultEdition, editions.length]);
  const byId = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);
  const ranked = useMemo(() => {
    if (!rows) return [];
    const seen = new Set<string>();
    return rows
      .map((e) => { const sn = sig(e[7] ?? ''); let rel = 0; for (const w of verseWords) if (sn.has(w)) rel++; return { e, w: byId.get(e[4]), n: words(e[7] ?? ''), rel }; })
      .filter((x) => !!x.w)
      .filter((x) => (min === 'all' ? true : min === 'cites' ? x.e[6] === 't' || x.n > 0 : x.n >= 80))
      .filter((x) => { const k = `${x.e[4]}-${x.e[5]}-${x.e[8] ?? ''}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => (b.rel - a.rel) || (b.n - a.n));
  }, [rows, byId, min, verseWords]);
  const byAuthor = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of ranked) m.set(x.w!.author, (m.get(x.w!.author) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [ranked]);
  return (
    <div className="page">
      <h1>Who quoted this verse?</h1>
      <p className="lede">Every place in the library where a Father or saint cites or comments on a passage, those that share the most words with the verse first, then the fullest. This is a rough guide to relevance, not a judgement of quality.</p>
      <form className="search-box" onSubmit={(e) => { e.preventDefault(); setSp({ ref: text.trim() }); }} role="search">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="John 6:51, Romans 8:28-30, Psalm 23…" aria-label="Passage" />
        <button className="btn primary" type="submit">Find quotations</button>
      </form>
      {sp.get('ref') && !parsed && <p className="notice">That does not look like a Bible reference. Try “John 6:51”.</p>}
      {parsed && (
        <>
          <div className="row" style={{ margin: '10px 0', gap: 6, flexWrap: 'wrap' }}>
            <strong>{formatRef(parsed)}</strong>
            {([['cites', 'With an excerpt'], ['long', 'Long excerpts (80+ words)'], ['all', 'Everything, including whole-homily commentaries']] as const).map(([k, l]) => <button key={k} className={`chip${min === k ? ' sel' : ''}`} aria-pressed={min === k} onClick={() => setMin(k)}>{l}</button>)}
          </div>
          {rows === null && !err && <p className="muted">Searching the library…</p>}
          {err && <p className="notice">{err}</p>}
          {rows && <p className="muted small">{ranked.length} place{ranked.length === 1 ? '' : 's'} in {new Set(ranked.map((x) => x.w!.author)).size} author{new Set(ranked.map((x) => x.w!.author)).size === 1 ? '' : 's'}.{byAuthor.length > 0 && <> Most: {byAuthor.map(([a, n]) => `${a} (${n})`).join(', ')}.</>}</p>}
          <ol className="list quote-list">
            {ranked.slice(0, 80).map(({ e, w, n, rel }) => (
              <li key={`${e[4]}-${e[5]}-${e[8] ?? ''}`} className="card">
                <div className="row between"><strong>{w!.author}</strong><span className="chip" title="words shared with the verse / length of the excerpt">{n ? `${rel} shared · ${n} words` : e[6] === 's' ? 'whole section' : 'cited'}</span></div>
                <div className="muted small">{w!.title}{w!.sections[e[5]] ? `, ${w!.sections[e[5]].title}` : ''}</div>
                {e[7] && <p style={{ margin: '8px 0' }}><Cited text={e[7].length > 600 ? e[7].slice(0, e[7].lastIndexOf(' ', 600)) + '…' : e[7]} /></p>}
                <Link className="small" to={w!.indexOnly ? `/study/passage/${refId(parsed)}` : `/study/works/${w!.id}/${e[5]}`}>{w!.indexOnly ? 'Open the passage study' : 'Read in context →'}</Link>
              </li>
            ))}
          </ol>
          {ranked.length > 80 && <p className="muted small">Showing the 80 fullest of {ranked.length}.</p>}
        </>
      )}
    </div>
  );
}
