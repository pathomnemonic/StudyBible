import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSynopsis, refsFromText } from '../../study/refData';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { passageText } from '../../lib/bibleText';
import RefLink from '../../components/RefLink';
import { formatRef } from '../../lib/refs';

const COLS = ['Matthew', 'Mark', 'Luke', 'John'];

/** The four Gospels' accounts of the same event, side by side, in the reader's chosen translation. On a phone the chosen passage replaces the list, with a way back. */
export default function SynopsisPage() {
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState<string[][]>([]);
  const [q, setQ] = useState('');
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const [edId, setEdId] = useState(s.defaultEdition);
  const ed = get(edId) ?? editions[0];
  const sel = sp.get('p');
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches);
  useEffect(() => { const m = window.matchMedia('(max-width: 899px)'); const f = () => setNarrow(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  useEffect(() => { if (sel) window.scrollTo({ top: 0 }); }, [sel]);
  const row = rows.find((r) => r[0] === sel);
  const [texts, setTexts] = useState<{ ref: string; verses: { v: number; c: number; text: string }[] }[][]>([]);
  useEffect(() => {
    getSynopsis().then((d) => setRows(d?.rows ?? []));
  }, []);
  const list = useMemo(() => rows.filter((r) => !q || r[0].toLowerCase().includes(q.toLowerCase())), [rows, q]);
  useEffect(() => {
    if (!row || !ed) return setTexts([]);
    let live = true;
    Promise.all(
      row.slice(1).map(async (c) => {
        const refs = c ? refsFromText(c) : [];
        return Promise.all(refs.map(async (r) => ({ ref: formatRef(r), verses: await passageText(ed, r, 40) })));
      }),
    ).then((t) => live && setTexts(t));
    return () => {
      live = false;
    };
  }, [sel, ed?.id, rows.length]);
  return (
    <div className="page wide">
      <h1>Gospel comparison</h1>
      <p className="lede">The four Gospels side by side: what each keeps, adds or leaves out.</p>
      {narrow && row && <button className="btn small" style={{ marginBottom: 8 }} onClick={() => setSp({})}>← All passages</button>}
      <div className="row" style={{ marginBottom: 8, display: narrow && row ? 'none' : undefined }}>
        <input type="search" placeholder="Find a passage…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a passage" />
        <select value={edId} onChange={(e) => setEdId(e.target.value)} aria-label="Translation">
          {editions.filter((e) => e.language === 'en' && !e.offByDefault).map((e) => <option key={e.id} value={e.id}>{e.shortName}</option>)}
        </select>
      </div>
      <div className="synopsis-layout">
        <ul className="list synopsis-list" style={{ display: narrow && row ? 'none' : undefined }}>
          {list.map((r) => (
            <li key={r[0]}>
              <button className={`linklike${r[0] === sel ? ' on' : ''}`} onClick={() => setSp({ p: r[0] })}>{r[0]}</button>
            </li>
          ))}
        </ul>
        <div>
          {!row && !narrow && <p className="muted">Choose a passage on the left.</p>}
          {row && (
            <>
              <h2>{row[0]}</h2>
              <div className="syn-cols">
                {COLS.map((name, i) => (
                  <div key={name} className="card">
                    <h3>{name}</h3>
                    {!row[i + 1] && <p className="muted small">No parallel in {name}.</p>}
                    {(texts[i] ?? []).map((t) => (
                      <div key={t.ref}>
                        <div className="small"><RefLink refv={refsFromText(t.ref)[0]}>{t.ref}</RefLink></div>
                        <p className="small" style={{ lineHeight: 1.55 }}>
                          {t.verses.map((v) => <span key={v.c + '.' + v.v}><sup>{v.v}</sup> {v.text} </span>)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="muted small">Parallel groupings follow common Gospel harmonies and are editorial; texts shown are from the translation you choose. Long passages are cut after 40 verses.</p>
    </div>
  );
}
