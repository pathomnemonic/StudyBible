import LibraryTabs from '../../components/LibraryTabs';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getJson } from '../../data/loader';
import { db } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { parseRefs, formatRef, refId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { passageText } from '../../lib/bibleText';
import { readerPath } from '../../lib/nav';
import { Cited } from '../../study/citations';
import NoteEditor from '../../components/NoteEditor';

interface Step { title: string; ref: string; intro: string; quote: { text: string; who: string; work: string; section: number; para: number } | null; question: string }
interface PathFile { id: string; title: string; blurb: string; minutes: number; steps: Step[] }
interface Meta { id: string; title: string; blurb: string; minutes: number; steps: number }

const progressKey = (id: string) => `path:${id}`;
const useProgress = (id?: string) => useLiveQuery(async () => (id ? ((await db.cache.get(progressKey(id)))?.value as number | undefined) ?? 0 : 0), [id]) ?? 0;

/** Guided paths: a theme followed through Scripture in short steps with the Fathers and a question at each. */
export function PathsIndex() {
  const [list, setList] = useState<Meta[]>([]);
  const all = useLiveQuery(() => db.cache.filter((r) => r.key.startsWith('path:')).toArray(), []) ?? [];
  useEffect(() => { getJson<{ paths: Meta[] }>('paths/index.json', true).then((d) => setList(d?.paths ?? [])); }, []);
  return (
    <div className="page">
      <LibraryTabs />
      <h1>Study paths</h1>
      <p className="lede">Follow one theme through Scripture in short steps: a passage, a few words of introduction, one voice from the Fathers or saints, and a question to take away. Each takes about {Math.round(list.reduce((a, p) => a + p.minutes, 0) / Math.max(1, list.length)) || 20} minutes and you can stop and return any time.</p>
      <div className="shelf">
        {list.map((p) => {
          const done = (all.find((r) => r.key === progressKey(p.id))?.value as number | undefined) ?? 0;
          return (
            <Link key={p.id} className="shelf-card" to={`/study/path/${p.id}`}>
              <span className="t">{p.title}</span>
              <span className="d">{p.blurb}</span>
              <span className="d">{p.steps} steps · about {p.minutes} min{done >= p.steps ? ' · ✓ Completed' : done > 0 ? ` · step ${Math.min(done + 1, p.steps)} next` : ''}</span>
              {done > 0 && <span className="bar"><i style={{ width: `${Math.round((done / p.steps) * 100)}%` }} /></span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function PathPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [path, setPath] = useState<PathFile | null | undefined>(undefined);
  const done = useProgress(id);
  const [i, setI] = useState<number | null>(null);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [verses, setVerses] = useState<{ v: number; c: number; text: string }[] | null>(null);
  const [note, setNote] = useState(false);
  useEffect(() => { getJson<PathFile>(`paths/${id}.json`, true).then((p) => setPath(p ?? null)); }, [id]);
  useEffect(() => { if (path && i === null) setI(Math.min(done, path.steps.length - 1)); }, [path, done]);
  const step = path && i !== null ? path.steps[i] : null;
  const parsed = step ? parseRefs(step.ref) : null;
  const anchor = parsed?.ok ? convertRef('kjv', 'vulgate', parsed.refs[0].ref).ref : null;
  useEffect(() => {
    setVerses(null);
    if (!anchor || !edition) return;
    let live = true;
    passageText(edition, anchor, 20).then((v) => live && setVerses(v));
    return () => { live = false; };
  }, [step?.ref, edition?.id]);
  if (path === undefined) return <div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>;
  if (path === null || !path || !step || i === null) return <div className="page"><Link to="/study/paths">← Study paths</Link><p>That path was not found.</p></div>;
  const go = async (n: number) => {
    setI(n);
    window.scrollTo(0, 0);
    if (n > done) await db.cache.put({ key: progressKey(id), value: n, ts: Date.now() });
  };
  const finish = async () => { await db.cache.put({ key: progressKey(id), value: path.steps.length, ts: Date.now() }); nav('/study/paths'); };
  return (
    <div className="page path-page">
      <Link to="/study/paths" className="small">← Study paths</Link>
      <h1>{path.title}</h1>
      <ol className="path-dots" aria-label="Steps">
        {path.steps.map((st, n) => <li key={n}><button className={`dot${n === i ? ' on' : n < done ? ' done' : ''}`} aria-label={`Step ${n + 1}: ${st.title}`} aria-current={n === i ? 'step' : undefined} onClick={() => go(n)} /></li>)}
      </ol>
      <div className="eyebrow-h">Step {i + 1} of {path.steps.length}</div>
      <h2>{step.title}</h2>
      <section className="reading-block">
        <div className="eyebrow">{anchor ? formatRef(parsed!.ok ? parsed!.refs[0].ref : anchor, { noDual: true }) : step.ref}</div>
        {verses === null && <p className="muted">Loading…</p>}
        {verses && <p className="scripture reading-text">{verses.map((v) => <span key={`${v.c}.${v.v}`}><sup>{v.v}</sup>{v.text} </span>)}</p>}
        {anchor && edition && <Link className="small" to={readerPath(edition, anchor)}>Open in the reader →</Link>}
      </section>
      <p>{step.intro}</p>
      {step.quote && (
        <blockquote className="path-quote">
          <p>“<Cited text={step.quote.text} />”</p>
          <footer>{step.quote.who} · <Link to={`/study/works/${step.quote.work}/${step.quote.section}`}>see it in context</Link></footer>
        </blockquote>
      )}
      <p className="path-question">{step.question}</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setNote(true)}>Write a reflection</button>
        {i > 0 && <button className="btn" onClick={() => go(i - 1)}>← Back</button>}
        {i < path.steps.length - 1 ? <button className="btn primary" onClick={() => go(i + 1)}>Next step →</button> : <button className="btn primary" onClick={finish}>Finish</button>}
      </div>
      {note && anchor && <NoteEditor initialTargets={[{ type: 'passage', ref: refId(anchor), label: `${path.title}: ${step.title}` } as any]} onClose={() => setNote(false)} />}
    </div>
  );
}
