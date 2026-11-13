import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { useEditions } from '../../data/EditionsContext';
import { passageText } from '../../lib/bibleText';
import { formatRef, parseRefId } from '../../lib/refs';
import { readerPath } from '../../lib/nav';
import { useSettings } from '../../lib/store';

interface Entry { id?: string; title: string; note: string; a?: string[]; date?: string; where?: string; url?: string }
interface File { about: string; entries: Entry[] }
const EDS = ['dra', 'webc', 'rsv2ce'];

function Compare({ refId: id }: { refId: string }) {
  const { get } = useEditions();
  const [rows, setRows] = useState<{ ed: string; name: string; text: string }[] | null>(null);
  useEffect(() => {
    const r = parseRefId(id);
    if (!r) { setRows([]); return; }
    let live = true;
    Promise.all(EDS.map(async (e) => {
      const rec = get(e);
      if (!rec) return null;
      try { const v = await passageText(rec, r, 3); return v.length ? { ed: e, name: rec.name, text: v.map((x) => x.text).join(' ') } : null; } catch { return null; }
    })).then((x) => live && setRows(x.filter(Boolean) as { ed: string; name: string; text: string }[]));
    return () => { live = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows) return <p className="muted small" role="status">Loading the translations…</p>;
  if (!rows.length) return <p className="muted small">These translations are not on this device yet.</p>;
  return <dl className="var-compare">{rows.map((r) => <div key={r.ed}><dt>{r.name}</dt><dd>{r.text}</dd></div>)}</dl>;
}

/** Where the ancient versions and manuscripts differ, and the same verse in the Douay-Rheims (which follows the Latin), the WEB and the RSV-CE. A small curated set, not a full apparatus. */
export default function VariantsPage() {
  const [set] = useSettings();
  const { get: getEd, editions } = useEditions();
  const edition = getEd(set.defaultEdition) ?? editions[0];
  const [v, setV] = useState<File | null | undefined>(undefined);
  const [w, setW] = useState<File | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { getJson<File>('lens/versions.json', true).then((x) => setV(x ?? null)); getJson<File>('lens/witnesses.json', true).then(setW); }, []);
  if (v === undefined) return <div className="page"><p className="muted" role="status">Loading…</p></div>;
  if (!v) return <div className="page"><p className="notice" role="alert">This data is not on this device yet. Save the study data in Downloads, or connect and try again.</p></div>;
  const lc = q.trim().toLowerCase();
  const list = v.entries.filter((e) => !lc || `${e.title} ${e.note}`.toLowerCase().includes(lc));
  return (
    <div className="page variants">
      <h1>Where the ancient texts differ</h1>
      <p className="lede">Places where the Hebrew, the Greek Old Testament (Septuagint) and the Latin Vulgate read differently, with the same verse in three English translations: the Douay-Rheims (from the Latin), the WEB and the RSV-CE. This is a short list chosen by hand, not a full critical apparatus, and it does not settle which reading is original.</p>
      <p className="notice small" role="note">Scholars disagree about some of these. Each note says what the texts read; it does not decide between them.</p>
      <label className="stack"><span>Search</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="isaiah, psalm, virgin…" aria-label="Search the list" /></label>
      <ul className="list">
        {list.map((e, i) => {
          const key = e.id ?? `v${i}`;
          const first = e.a?.[0];
          const r = first ? parseRefId(first) : null;
          return (
            <li key={key} className="card">
              <h2 className="card-title">{e.title}</h2>
              <p>{e.note}</p>
              {r && (
                <>
                  <button className="btn small" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}>{open === key ? 'Hide' : 'Show'} the verse in three translations</button>{' '}
                  {edition && <Link className="btn small ghost" to={readerPath(edition, r)}>Open {formatRef(r)}</Link>}
                  {open === key && <Compare refId={first!} />}
                </>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="muted">Nothing matches that search.</li>}
      </ul>
      {w && (
        <section>
          <h2 className="eyebrow-h">The manuscripts and versions behind the text</h2>
          <ul className="list">
            {w.entries.map((e, i) => <li key={e.id ?? `w${i}`} className="card"><strong>{e.title}</strong>{e.date ? <span className="muted small"> · {e.date}</span> : null}{e.where ? <span className="muted small"> · {e.where}</span> : null}<p>{e.note}</p>{e.url && <a className="small" href={e.url} target="_blank" rel="noreferrer noopener">Digital edition ↗</a>}</li>)}
          </ul>
        </section>
      )}
      <p className="muted small">Written for this app in its own words. Dates are scholars’ estimates. A larger, sourced variant table is a separate piece of data work; see <Link to="/study/sources">Sources</Link>.</p>
    </div>
  );
}
