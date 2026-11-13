import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { parseRefId } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { BOOK_BY_ID } from '../../lib/canon';
import { personalLayer, indexGraph, KIND_LABEL, loadConceptGraph, neighbours, shortestPath, type ConceptGraph, type GNode, type Index, type Kind } from '../../lib/conceptGraph';

const KIND_ORDER: Kind[] = ['note', 'topic', 'argument', 'claim', 'development', 'heresy', 'word', 'situation', 'life', 'passage', 'catechism', 'work', 'author'];
const PALETTE: Record<Kind, string> = {
  topic: '#2f7d5b', argument: '#4a6f8a', claim: '#4a6f8a', development: '#4a6f8a', heresy: '#8a2f39', word: '#6b5b95', situation: '#b4631f', life: '#b4631f',
  passage: '#7a6a2f', catechism: '#2f7d5b', work: '#5b6b7a', author: '#6b5b95', note: '#b4631f',
};

/** Finds nodes whose label contains every word of the query, best (shortest) labels first. */
const find = (g: ConceptGraph, q: string, limit = 12) => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return g.nodes.filter((n) => words.every((w) => n.label.toLowerCase().includes(w) || (n.sub ?? '').toLowerCase().includes(w))).sort((a, b) => a.label.length - b.label.length).slice(0, limit);
};

function Picker({ g, label, value, onPick }: { g: ConceptGraph; label: string; value: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => find(g, q), [g, q]);
  return (
    <div className="cm-pick">
      <label className="stack"><span>{label}</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name, topic, work or passage" aria-label={label} /></label>
      {q.trim() && (
        <ul className="cm-hits" aria-label={`${label}: matches`}>
          {hits.length === 0 && <li className="muted small">Nothing matches.</li>}
          {hits.map((n) => <li key={n.id}><button className={`chip${n.id === value ? ' on' : ''}`} onClick={() => { onPick(n.id); setQ(''); }}>{n.label} <span className="muted small">{KIND_LABEL[n.kind]}</span></button></li>)}
        </ul>
      )}
    </div>
  );
}

/** A ring around one node: its neighbours, grouped by kind. An aid to seeing the shape; the grouped lists hold the same links. */
function Ring({ centre, groups, go }: { centre: GNode; groups: ReturnType<typeof neighbours>; go: (id: string) => void }) {
  const items = groups.flatMap((g) => g.items.slice(0, 14).map((i) => ({ ...i, kind: g.kind })));
  const R = 150, W = 420, H = 380, cx = W / 2, cy = H / 2;
  return (
    <svg className="cm-ring" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${centre.label} and ${items.length} of its connections, grouped by kind. The same links are listed in groups after the picture.`}>
      {items.map((it, i) => { const a = (2 * Math.PI * i) / items.length - Math.PI / 2; const x = cx + R * Math.cos(a), y = cy + (R - 20) * Math.sin(a); return <line key={`l${it.node.id}${it.type}`} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />; })}
      {items.map((it, i) => {
        const a = (2 * Math.PI * i) / items.length - Math.PI / 2; const x = cx + R * Math.cos(a), y = cy + (R - 20) * Math.sin(a);
        const label = it.node.label.length > 20 ? `${it.node.label.slice(0, 19)}…` : it.node.label;
        return (
          <g key={`n${it.node.id}${it.type}`} onClick={() => go(it.node.id)} style={{ cursor: 'pointer' }}>
            <title>{`${it.node.label} (${KIND_LABEL[it.kind]}; ${it.type})`}</title>
            <circle cx={x} cy={y} r="6" fill={PALETTE[it.kind]} />
            <text x={x} y={y + (y < cy ? -10 : 17)} textAnchor="middle" fontSize="9.5" fill="var(--fg)">{label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="34" fill="var(--accent-soft, var(--surface))" stroke="var(--accent)" strokeWidth="2" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--fg)">{centre.label.length > 16 ? `${centre.label.slice(0, 15)}…` : centre.label}</text>
    </svg>
  );
}

/** The map of how this app's teachings, passages, works and people connect. Every link comes from a source file; nothing is guessed. */
export default function ConceptMapPage() {
  const [sp, setSp] = useSearchParams();
  const [g, setG] = useState<ConceptGraph | null | undefined>(undefined);
  useEffect(() => { loadConceptGraph().then(setG); }, []);
  const [withMine, setWithMine] = useState(false);
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const merged = useMemo(() => {
    if (!g || !withMine) return g ?? null;
    const have = new Set(g.nodes.map((n) => n.id));
    const layer = personalLayer(notes, (ref) => { const r = parseRefId(ref); if (!r) return null; const e = convertRef('vulgate', 'kjv', r).ref; return { book: e.book, c: e.c1, name: `${BOOK_BY_ID[e.book]?.name ?? e.book} ${e.c1}` }; }, (id) => have.has(id));
    return { ...g, nodes: [...g.nodes, ...layer.nodes.filter((n) => !have.has(n.id))], edges: [...g.edges, ...layer.edges] };
  }, [g, withMine, notes]);
  const ix: Index | null = useMemo(() => (merged ? indexGraph(merged) : null), [merged]);
  const id = sp.get('n') ?? 'topic:eucharist';
  const to = sp.get('to') ?? '';
  const centre = ix?.byId.get(id) ?? ix?.byId.get('topic:eucharist');
  const groups = useMemo(() => (ix && centre ? neighbours(ix, centre.id) : []), [ix, centre]);
  const path = useMemo(() => (ix && centre && to ? shortestPath(ix, centre.id, to) : undefined), [ix, centre, to]);
  const go = (n: string) => setSp((p) => { const q = new URLSearchParams(p); q.set('n', n); return q; });
  const setTo = (n: string) => setSp((p) => { const q = new URLSearchParams(p); if (n) q.set('to', n); else q.delete('to'); return q; });

  if (g === undefined) return <div className="page"><p className="muted" role="status">Loading the map…</p></div>;
  if (g === null || !ix || !centre) return <div className="page"><h1>Map of connections</h1><p className="notice" role="alert">The map data is not on this device yet. Save the study data in Downloads, or connect and try again.</p></div>;

  return (
    <div className="page concept-map">
      <h1>Map of connections</h1>
      <p className="lede">How the app’s teachings, Bible chapters, Catechism paragraphs, works and people link up. Every link comes from a source file in the app: a chain that cites a passage, a topic that lists one, a work with its author. Pick something, then follow its links.</p>
      <p className="muted small">{g.nodes.length.toLocaleString()} things and {g.edges.length.toLocaleString()} links, built {g.generated}.</p>

      <section className="card" aria-label="Choose where to start">
        <Picker g={merged ?? g} label="Start from" value={centre.id} onPick={go} />
        <label className="row" style={{ gap: 8, marginTop: 8 }}><input type="checkbox" checked={withMine} onChange={(e) => setWithMine(e.target.checked)} /> Include my notes (they join the Bible chapters they are written on, and the argument they were written for). Stays on this device.</label>
      </section>

      <section className="card" aria-label={`Connections of ${centre.label}`}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div><span className="chip small">{KIND_LABEL[centre.kind]}</span> <h2 className="card-title" style={{ display: 'inline' }}>{centre.label}</h2>{centre.sub && <span className="muted small"> · {centre.sub}</span>}</div>
          {centre.to && <Link className="btn small" to={centre.to}>Open it</Link>}
        </div>
        {groups.length === 0 ? <p className="muted">This has no links in the data yet.</p> : <Ring centre={centre} groups={groups} go={go} />}
        {groups.map((gr) => (
          <details key={gr.kind} open={gr.items.length <= 12} className="cm-group">
            <summary><strong>{KIND_LABEL[gr.kind]}</strong> <span className="muted small">{gr.items.length}</span></summary>
            <ul className="cm-list">
              {gr.items.map((it) => (
                <li key={`${it.node.id}|${it.type}`}>
                  <button className="linklike" onClick={() => go(it.node.id)}>{it.node.label}</button>
                  <span className="muted small"> {it.type}{it.node.sub ? ` · ${it.node.sub}` : ''}</span>
                  {it.node.to && <> <Link className="small" to={it.node.to}>open</Link></>}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>

      <section className="card" aria-label="How are two things connected?">
        <h2 className="card-title">How is {centre.label} connected to something else?</h2>
        <Picker g={g} label="Connect it to" value={to} onPick={setTo} />
        {to && ix.byId.get(to) && path === null && <p className="muted">No chain of links joins {centre.label} to {ix.byId.get(to)!.label} in the data, within six steps.</p>}
        {path && (
          <ol className="cm-path" aria-label="The chain of links">
            {path.map((s, i) => { const n = ix.byId.get(s.id)!; return <li key={s.id}>{i > 0 && <span className="muted small">{path[i].via} → </span>}<button className="linklike" onClick={() => go(s.id)}>{n.label}</button> <span className="muted small">{KIND_LABEL[n.kind]}</span></li>; })}
          </ol>
        )}
        {to && <p><button className="btn small ghost" onClick={() => setTo('')}>Clear</button></p>}
      </section>
      <p className="muted small">Where two things are not linked here, they may still be related: the map shows what the data states, not every connection there is.</p>
    </div>
  );
}
