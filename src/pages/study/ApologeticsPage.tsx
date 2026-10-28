import PrintButton from '../../components/PrintButton';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { cccRange, type CccPara } from '../../data/ccc';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { parseRefs, formatRef, type Ref } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { passageText } from '../../lib/bibleText';
import { readerPath } from '../../lib/nav';

export interface ApoTopic {
  id: string; category: string; title: string; objection: string;
  verses: { ref: string }[]; ccc: number[]; tags: string[]; related: string[];
  reading: { title: string; url: string; source: string; type: string }[];
}
interface ApoData { categories: string[]; topics: ApoTopic[] }
let cache: Promise<ApoData | null> | null = null;
export const loadApologetics = () => (cache ??= getJson<ApoData>('apologetics.json', true));
const SRC: Record<string, string> = { 'catholic-answers': 'Catholic Answers', 'st-paul-center': 'St. Paul Center', 'word-on-fire': 'Word on Fire', ascension: 'Ascension', 'jimmy-akin': 'Jimmy Akin', 'catholic-productions': 'Catholic Productions', 'new-advent': 'New Advent', ewtn: 'EWTN', 'augustine-institute': 'Augustine Institute', usccb: 'USCCB', 'thomistic-institute': 'Thomistic Institute', 'breaking-in-the-habit': 'Breaking in the Habit', 'pints-with-aquinas': 'Pints with Aquinas', godsplaining: 'Godsplaining', 'acts-xxix': 'ACTS XXIX', 'shameless-popery': 'Shameless Popery', 'catholic-talk-show': 'The Catholic Talk Show', 'trent-horn': 'Trent Horn', encyclopedia: 'Catholic Encyclopedia' };
export const topicAnchors = (t: ApoTopic): Ref[] => t.verses.flatMap((v) => { const p = parseRefs(v.ref.split(',')[0]); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; });
/** topics whose key verses overlap a selection (for the study panel) */
export async function apologeticsFor(sel: Ref[]): Promise<ApoTopic[]> {
  const d = await loadApologetics();
  return (d?.topics ?? []).filter((t) => topicAnchors(t).some((a) => sel.some((x) => x.book === a.book && x.c1 <= a.c2 && a.c1 <= x.c2 && (x.v1 === undefined || a.v1 === undefined || a.c1 !== a.c2 || x.c1 !== x.c2 || (x.v1 <= (a.v2 ?? a.v1) && a.v1 <= (x.v2 ?? x.v1))))));
}

function Verse({ v }: { v: { ref: string } }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<{ v: number; text: string }[] | null>(null);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const nav = useNavigate();
  const ed = get(s.defaultEdition) ?? editions[0];
  const ref = useMemo(() => { const p = parseRefs(v.ref); return p.ok ? convertRef('kjv', 'vulgate', p.refs[0].ref).ref : null; }, [v.ref]);
  useEffect(() => { if (open && ref && ed && !text) passageText(ed, ref, 14).then((t) => setText(t.map((x) => ({ v: x.v, text: x.text })))); }, [open]);
  return (
    <li>
      <button className="linklike" aria-expanded={open} onClick={() => setOpen(!open)}><strong>{v.ref}</strong></button>
      {open && (
        <div className="ex xtext">
          {!text && 'Loading…'}
          {text?.map((x) => <div key={x.v}><sup>{x.v}</sup> {x.text}</div>)}
          {ref && ed && <button className="btn small ghost" onClick={() => nav(readerPath(ed, ref))}>Open in the Bible</button>}
        </div>
      )}
    </li>
  );
}

const GROUPS: { title: string; types: string[] }[] = [
  { title: 'Tracts and articles', types: ['tract', 'article', 'encyclopedia'] },
  { title: 'Questions answered by Catholic apologists', types: ['qa'] },
  { title: 'Videos and talks', types: ['video', 'podcast'] },
  { title: 'Passage by passage (Catholic Answers Bible Navigator)', types: ['page'] },
];
function Resources({ items }: { items: ApoTopic['reading'] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return <p className="muted">No linked resources yet.</p>;
  return (
    <>
      {GROUPS.map((g) => {
        const list = items.filter((r) => g.types.includes(r.type));
        if (!list.length) return null;
        const shown = all ? list : list.slice(0, 5);
        return (
          <section key={g.title}>
            <h2>{g.title}</h2>
            <ul className="apo-reading">{shown.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title} ↗</a> <span className="muted small">{SRC[r.source] ?? r.source}</span></li>)}</ul>
            {list.length > 5 && !all && <button className="btn small ghost" onClick={() => setAll(true)}>Show {list.length - 5} more</button>}
          </section>
        );
      })}
    </>
  );
}

function TopicView({ t, all }: { t: ApoTopic; all: ApoTopic[] }) {
  const [paras, setParas] = useState<CccPara[]>([]);
  const [more, setMore] = useState(false);
  useEffect(() => {
    setMore(false);
    const nums = [...new Set(t.ccc)].sort((a, b) => a - b);
    Promise.all(nums.map((n) => cccRange(n, n))).then((r) => setParas(r.flat()));
  }, [t.id]);
  const shown = more ? paras : paras.slice(0, 4);
  return (
    <div className="page apo">
      <Link to="/study/apologetics" className="small">← Questions about the faith</Link>
      <div className="kicker">{t.category}</div>
      <h1>{t.title} <PrintButton /></h1>
      <blockquote className="apo-q"><strong>The question.</strong> {t.objection}</blockquote>
      <p className="muted small">This page does not answer the question itself. It gathers what Catholic authors and teachers have written and said about it, so you can read them in their own words, with the verses and Catechism paragraphs they appeal to.</p>
      <Resources items={t.reading} />
      <h2>In the Bible</h2>
      <ul className="apo-verses">{t.verses.map((v) => <Verse key={v.ref} v={v} />)}</ul>
      <h2>In the Catechism</h2>
      {paras.length === 0 && <p className="muted">Loading…</p>}
      {shown.map((p) => <p key={p.n} className="ccc-q"><Link to={`/study/catechism/${p.n}`}><strong>§{p.n}</strong></Link> {p.t}</p>)}
      {paras.length > 4 && <button className="btn small" onClick={() => setMore(!more)}>{more ? 'Show fewer paragraphs' : `Show ${paras.length - 4} more paragraphs`}</button>}
      {t.related.length > 0 && (
        <p className="small">Related: {t.related.map((id) => all.find((x) => x.id === id)).filter(Boolean).map((x, i) => <span key={x!.id}>{i ? ' · ' : ''}<Link to={`/study/apologetics/${x!.id}`}>{x!.title}</Link></span>)}</p>
      )}
      <p className="muted small">Links go to the authors’ own pages. They are chosen by matching topic keywords and then checked by title, so a link may sometimes be only loosely related; a priest or a good Catholic teacher can help with a hard question.</p>
    </div>
  );
}

/** Answers to common questions and objections, tied to the verses and Catechism paragraphs behind them. */
export default function ApologeticsPage() {
  const { id } = useParams();
  const [d, setD] = useState<ApoData | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { loadApologetics().then(setD); }, []);
  if (!d) return <div className="page"><p className="muted">Loading…</p></div>;
  const t = id ? d.topics.find((x) => x.id === id) : null;
  if (t) return <TopicView t={t} all={d.topics} />;
  const f = q.trim().toLowerCase();
  const match = (x: ApoTopic) => !f || `${x.title} ${x.objection} ${x.tags.join(' ')}`.toLowerCase().includes(f);
  return (
    <div className="page apo">
      <h1>Questions about the faith</h1>
      <p className="lede">Straight answers to the questions people ask, with the verses and Catechism paragraphs behind them.</p>
      <input type="search" placeholder="Search the questions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
      {d.categories.map((c) => {
        const list = d.topics.filter((x) => x.category === c && match(x));
        if (!list.length) return null;
        return (
          <section key={c}>
            <h2>{c}</h2>
            <ul className="list apo-list">{list.map((x) => <li key={x.id}><Link to={`/study/apologetics/${x.id}`}><strong>{x.title}</strong><span className="muted small"> {x.objection}</span></Link></li>)}</ul>
          </section>
        );
      })}
    </div>
  );
}
