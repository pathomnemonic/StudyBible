import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEditions } from '../../data/EditionsContext';
import { EnableEditionDialog, useChoosable } from '../../components/EditionGate';
import type { EditionRecord } from '../../data/loader';
import { anchorChapterText } from '../../lib/bibleText';
import { alignVerses, diffWords, type AlignedRow, type Cell } from '../../lib/compareDiff';
import { formatRef, parseRefId, parseRefs, refId, type Ref } from '../../lib/refs';
import { convertRef } from '../../lib/versification';

const MAX_COLS = 3;
const DEFAULT_REF = 'JHN.1.1-5';
const usable = (e: EditionRecord) => e.bundled && (e.rights === 'public-domain' || e.rights === 'open-license');

function Badges({ e }: { e: EditionRecord }) {
  return (
    <span className="ct-badges">
      {e.approval === 'approved' && <span className="chip good" title={e.approvalNote}>Church-approved</span>}
      {e.approval === 'none' && <span className="chip" title={e.approvalNote}>Not Church-approved</span>}
      <span className={`chip ${e.rights === 'public-domain' ? 'good' : ''}`}>{e.rights.replace('-', ' ')}</span>
    </span>
  );
}

/** One passage in up to three bundled translations, verse by verse, with the words that differ from the first column marked. */
export default function CompareTranslationsPage() {
  const [sp, setSp] = useSearchParams();
  const { editions, ready, get } = useEditions();
  const { choosable, off } = useChoosable();
  const pickable = useMemo(() => choosable.filter(usable), [choosable]);
  const ref: Ref | null = useMemo(() => parseRefId(sp.get('ref') ?? DEFAULT_REF), [sp]);
  const ids = useMemo(() => {
    const asked = (sp.get('e') ?? '').split(',').filter((id) => pickable.some((p) => p.id === id));
    const uniq = [...new Set(asked)].slice(0, MAX_COLS);
    if (uniq.length) return uniq;
    return ['webc', 'cpdv'].filter((id) => pickable.some((p) => p.id === id));
  }, [sp, pickable]);
  const cols = ids.map((id) => get(id)).filter(Boolean) as EditionRecord[];
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [enabling, setEnabling] = useState<EditionRecord | null>(null);
  const [state, setState] = useState<{ rows: AlignedRow[]; truncated: boolean } | null>(null);

  useEffect(() => { if (ref) setText(formatRef(ref, { noDual: true })); }, [ref ? refId(ref) : '']);

  useEffect(() => {
    if (!ref || !cols.length) { setState(null); return; }
    let live = true;
    setState(null);
    (async () => {
      const maps: Map<string, Cell>[] = cols.map(() => new Map());
      for (let c = ref.c1; c <= Math.min(ref.c2, ref.c1 + 2); c++) {
        const texts = await Promise.all(cols.map((e) => anchorChapterText(e, ref.book, c)));
        texts.forEach((t, k) => { for (const [v, x] of t.verses) maps[k].set(`${c}.${v}`, { native: x.native, text: x.text, exact: x.exact, note: x.note }); });
      }
      if (live) setState(alignVerses(ref, maps));
    })();
    return () => { live = false; };
  }, [ref ? refId(ref) : '', cols.map((c) => c.id).join(',')]);

  const update = (next: { ref?: string; e?: string[] }) => {
    const n = new URLSearchParams(sp);
    if (next.ref) n.set('ref', next.ref);
    if (next.e) n.set('e', next.e.join(','));
    setSp(n, { replace: true });
  };
  const go = (ev: React.FormEvent) => {
    ev.preventDefault();
    const r = parseRefs(text);
    if (!r.ok) { setErr(r.error + (r.suggestions.length ? ` Did you mean ${r.suggestions.join(', ')}?` : '')); return; }
    setErr('');
    // Typed numbers follow the modern (English) numbering most readers use; the page works in the Vulgate anchor numbering.
    update({ ref: refId(convertRef('english', 'vulgate', r.refs[0].ref).ref) });
  };
  const setCol = (i: number, id: string) => {
    const next = [...ids];
    if (id) next[i] = id; else next.splice(i, 1);
    update({ e: [...new Set(next)] });
  };
  const base = cols[0];
  const colVar = { '--ct-cols': `repeat(${cols.length || 1}, minmax(0, 1fr))` } as React.CSSProperties;

  return (
    <div className="page ct">
      <h1>Compare translations</h1>
      <p className="lede">One passage in up to three translations, verse by verse. Words that differ from the first column are marked.</p>
      <form className="ct-form no-print" onSubmit={go}>
        <label className="small">Passage
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="John 1:1-5" aria-label="Passage" autoCapitalize="off" />
        </label>
        <button className="btn primary" type="submit">Compare</button>
      </form>
      {err && <p className="notice" role="alert">{err}</p>}
      <div className="ct-pick no-print">
        {[0, 1, 2].map((i) => (i <= ids.length ? (
          <label key={i} className="small">{i === 0 ? 'First (the base)' : i === 1 ? 'Second' : 'Third'}
            <select value={ids[i] ?? ''} onChange={(e) => setCol(i, e.target.value)} aria-label={`Translation ${i + 1}`}>
              {i > 0 && <option value="">None</option>}
              {pickable.map((p) => <option key={p.id} value={p.id}>{p.shortName}: {p.name}</option>)}
            </select>
          </label>
        ) : null))}
      </div>
      {off.filter(usable).length > 0 && (
        <p className="small muted no-print">Off by default: {off.filter(usable).map((e) => <button key={e.id} className="chip" onClick={() => setEnabling(e)}>{e.shortName}</button>)} Choose one to read why and turn it on.</p>
      )}
      {!ref && ready && <p className="notice">That link does not name a passage. Type one such as John 1:1-5.</p>}
      {ref && <h2 className="ct-ref">{formatRef(ref)}</h2>}
      {ref && cols.length > 0 && (
        <div className="ct-table" role="table" aria-label="Translations side by side">
          <div className="ct-head" role="row" style={colVar}>
            {cols.map((e) => (
              <div key={e.id} role="columnheader" className="ct-colhead">
                <strong>{e.name}</strong>
                <Badges e={e} />
                <span className="small muted">{e.languageName}{e.year ? ` · ${e.year}` : ''}</span>
              </div>
            ))}
          </div>
          {!state && <p className="muted">Loading…</p>}
          {state && state.rows.length === 0 && <p className="notice">No text was found for that passage in these translations.</p>}
          {state?.rows.map((r) => (
            <div key={`${r.c}.${r.v}`} className="ct-row" role="row" style={colVar}>
              {r.cells.map((cell, i) => {
                const e = cols[i];
                const sameLang = base && e.language === base.language;
                const pieces = cell && i > 0 && sameLang && r.cells[0] ? diffWords(r.cells[0].text, cell.text) : null;
                return (
                  <div key={e.id} role="cell" className="ct-cell" lang={e.language} dir={e.rtl ? 'rtl' : undefined}>
                    <span className="ct-cell-name small muted">{e.shortName}</span>
                    {cell ? (
                      <p>
                        <sup className="ct-vn" title={cell.note}>{cell.native}{!cell.exact ? '?' : ''}</sup>{' '}
                        {pieces ? pieces.map((p, k) => (p.changed ? <mark key={k} className="ct-diff">{p.text} </mark> : `${p.text} `)) : cell.text}
                      </p>
                    ) : <p className="muted small">No matching verse in this translation.</p>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {state?.truncated && <p className="notice">Only the first 60 verses are shown. Choose a shorter passage to see the rest.</p>}
      {cols.some((e) => base && e.language !== base.language) && <p className="small muted">Words are only marked between translations in the same language as the first column.</p>}
      {cols.length > 0 && <p className="small muted ct-note">Verse numbers shown are each translation’s own, so they can differ in the Psalms and a few other books. A question mark means the match is approximate. Sources: {cols.map((e) => e.attribution).join(' ')}</p>}
      {ref && <p className="no-print"><Link className="btn small ghost" to={`/read/${base?.id ?? 'webc'}/${ref.book}/${ref.c1}`}>Read the whole chapter</Link></p>}
      {enabling && <EnableEditionDialog edition={enabling} onClose={() => setEnabling(null)} />}
      {!editions.length && !ready && <p className="muted">Loading…</p>}
    </div>
  );
}
