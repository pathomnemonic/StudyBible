import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cccAll, cccRange, getCccIndex, MAX_PARA, type CccIndex, type CccPara } from '../../data/ccc';
import { formatRef, parseRefs } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { readerPath } from '../../lib/nav';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { db } from '../../db/db';

const WINDOW = 8;

const ABBR: Record<string, string> = {
  GS: 'Gaudium et Spes', LG: 'Lumen Gentium', SC: 'Sacrosanctum Concilium', DV: 'Dei Verbum', DH: 'Dignitatis Humanae', NA: 'Nostra Aetate', UR: 'Unitatis Redintegratio', AG: 'Ad Gentes', AA: 'Apostolicam Actuositatem',
  CD: 'Christus Dominus', PO: 'Presbyterorum Ordinis', OT: 'Optatam Totius', PC: 'Perfectae Caritatis', GE: 'Gravissimum Educationis', IM: 'Inter Mirifica', OE: 'Orientalium Ecclesiarum',
  CT: 'Catechesi Tradendae (John Paul II)', FC: 'Familiaris Consortio (John Paul II)', EN: 'Evangelii Nuntiandi (Paul VI)', RMiss: 'Redemptoris Missio (John Paul II)', SRS: 'Sollicitudo Rei Socialis (John Paul II)',
  CA: 'Centesimus Annus (John Paul II)', LE: 'Laborem Exercens (John Paul II)', RH: 'Redemptor Hominis (John Paul II)', DM: 'Dives in Misericordia (John Paul II)', DeV: 'Dominum et Vivificantem (John Paul II)',
  MD: 'Mulieris Dignitatem (John Paul II)', MC: 'Marialis Cultus (Paul VI)', HV: 'Humanae Vitae (Paul VI)', PT: 'Pacem in Terris (John XXIII)', MM: 'Mater et Magistra (John XXIII)', PP: 'Populorum Progressio (Paul VI)',
  CPG: 'Credo of the People of God (Paul VI)', RP: 'Reconciliatio et Paenitentia (John Paul II)', CL: 'Christifideles Laici (John Paul II)', PDV: 'Pastores Dabo Vobis (John Paul II)', VS: 'Veritatis Splendor (John Paul II)',
  EV: 'Evangelium Vitae (John Paul II)', UUS: 'Ut Unum Sint (John Paul II)', FR: 'Fides et Ratio (John Paul II)', SpS: 'Spe Salvi (Benedict XVI)', DCE: 'Deus Caritas Est (Benedict XVI)',
};
/** "GS 18" → "Gaudium et Spes 18": the Catechism's own shorthand for Church documents, in full */
const spell = (t: string) => t.replace(/^(?:cf\.?\s+)?([A-Za-z]{2,5})\s*#?\s*(\d[\d,;\- ]*)\.?$/, (m, a: string, n: string) => (ABBR[a] ? `${ABBR[a]} §${n.trim()}` : m));

/** a footnote such as "Mt 28:19-20; Acts 2:42" becomes links into the Bible reader; anything else stays as written */
function Cites({ text, onOpen }: { text: string; onOpen: (ref: ReturnType<typeof parseRefs> & { ok: true }) => string }) {
  const lead = /^\s*(cf\.?|see)\s+/i.exec(text);
  const rest = text.replace(/^\s*(cf\.?|see)\s+(?:also\s+)?/i, '');
  const parts = rest.split(/;\s*/).map((x) => x.replace(/^(?:cf\.?|see)\s+(?:also\s+)?/i, ''));
  const anyRef = parts.some((x) => parseRefs(x.trim().replace(/\b(\d+)\s+(\d+)\b(?!:)/, '$1:$2').replace(/\.$/, '')).ok);
  if (!anyRef) return <>{spell(rest.trim()) === rest.trim() ? text.replace(/^\s*cf\.?\s+/i, 'Compare ') : (lead ? 'Compare ' : '') + spell(rest.trim())}</>;
  return (
    <>
      {lead ? 'Compare ' : ''}
      {parts.map((p, i) => {
        const fixed = p.trim().replace(/\b(\d+)\s+(\d+)\b(?!:)/, '$1:$2').replace(/\.$/, '');
        const r = parseRefs(fixed);
        return <span key={i}>{i ? '; ' : ''}{r.ok ? <>{/^cf/i.test(p.trim()) ? 'compare ' : ''}<Link to={onOpen(r as any)}>{formatRef(r.refs[0].ref, { noDual: true })}{r.refs.length > 1 ? ' …' : ''}</Link></> : spell(p.trim())}</span>;
      })}
    </>
  );
}

/** The Catechism of the Catholic Church, read in the app: any paragraph with its neighbors, its Scripture footnotes as links, and a search. */
export default function CatechismPage() {
  const { n } = useParams();
  const nav = useNavigate();
  const target = Math.min(MAX_PARA, Math.max(1, parseInt(n ?? '1', 10) || 1));
  const start = Math.max(1, target - 2);
  const [paras, setParas] = useState<CccPara[] | null>(null);
  const [idx, setIdx] = useState<CccIndex | null>(null);
  const [q, setQ] = useState('');
  const [all, setAll] = useState<CccPara[] | null>(null);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  useEffect(() => { getCccIndex().then(setIdx); }, []);
  useEffect(() => { setParas(null); cccRange(start, start + WINDOW - 1).then(setParas); db.history.add({ ts: Date.now(), type: 'catechism', ref: String(target), label: `Catechism §${target}` }).catch(() => {}); }, [start, target]);
  useEffect(() => { if (q.trim().length > 2 && !all) cccAll().then(setAll); }, [q, all]);
  useEffect(() => { document.getElementById(`ccc-${target}`)?.scrollIntoView({ block: 'center' }); }, [paras, target]);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 3 || !all) return [];
    return all.filter((p) => p.t.toLowerCase().includes(t)).slice(0, 40);
  }, [q, all]);
  const heading = useMemo(() => idx?.headings.filter((h) => h.before <= target).slice(-1)[0]?.t, [idx, target]);
  const open = (r: { refs: { ref: any }[] }) => (edition ? readerPath(edition, convertRef('kjv', 'vulgate', r.refs[0].ref).ref) : '/read');
  return (
    <div className="page ccc-page">
      <h1>Catechism of the Catholic Church</h1>
      <p className="lede">The text of the Catechism, paragraph by paragraph. The small numbers at the end of a paragraph are its footnotes; Scripture references open in the Bible. The text is © Libreria Editrice Vaticana and is shown with permission.</p>
      <form className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10 }} onSubmit={(e) => { e.preventDefault(); const v = parseInt(new FormData(e.currentTarget).get('para') as string, 10); if (v) nav(`/study/catechism/${v}`); }}>
        <label>Go to paragraph <input name="para" type="number" min={1} max={MAX_PARA} defaultValue={target} style={{ width: 90 }} /></label>
        <button className="btn">Go</button>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the Catechism" aria-label="Search the Catechism" style={{ flex: 1, minWidth: 180 }} />
      </form>
      {q.trim().length > 2 ? (
        <section aria-label="Search results">
          {!all && <div className="skeleton-list" aria-busy="true"><i /><i /></div>}
          {all && <p className="muted small">{hits.length === 40 ? 'First 40 paragraphs' : `${hits.length} paragraph${hits.length === 1 ? '' : 's'}`} containing “{q}”.</p>}
          {hits.map((p) => <p key={p.n}><Link to={`/study/catechism/${p.n}`}><strong>§{p.n}</strong></Link> {p.t.slice(0, 260)}{p.t.length > 260 ? '…' : ''}</p>)}
        </section>
      ) : (
        <>
          {heading && <div className="eyebrow">{heading}</div>}
          {!paras && <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>}
          {paras?.length === 0 && <div className="empty">This paragraph is not in the app’s copy of the Catechism yet.</div>}
          {paras?.map((p) => (
            <section key={p.n} id={`ccc-${p.n}`} className={`ccc-para${p.n === target ? ' on' : ''}`}>
              <h2 className="ccc-n"><Link to={`/study/catechism/${p.n}`} aria-label={`Paragraph ${p.n}`}>{p.n}</Link></h2>
              <div>
                {p.t.split('\n').map((l, i) => <p key={i}>{l}</p>)}
                {p.fn.length > 0 && <ol className="ccc-fn small muted">{p.fn.map((f) => <li key={f.id} value={f.id}><Cites text={f.t} onOpen={open as any} /></li>)}</ol>}
              </div>
            </section>
          ))}
          <div className="row between">
            <button className="btn" disabled={target <= 1} onClick={() => nav(`/study/catechism/${Math.max(1, target - WINDOW + 2)}`)}>← Earlier</button>
            <button className="btn" disabled={target >= MAX_PARA} onClick={() => nav(`/study/catechism/${Math.min(MAX_PARA, target + WINDOW - 2)}`)}>Later →</button>
          </div>
        </>
      )}
      <p className="muted small">Source: Catechism of the Catholic Church, English translation, Libreria Editrice Vaticana (<a href="https://www.vatican.va/archive/ENG0015/_INDEX.HTM" target="_blank" rel="noreferrer">vatican.va</a>).</p>
    </div>
  );
}
