import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getDoctrine } from '../../data/content';
import { buildGraph, type GEdge, type GNode, type NodeKind } from '../../lib/graphData';
import RefLink from '../../components/RefLink';

const KIND_LABEL: Record<NodeKind, string> = { note: 'Notes', question: 'Questions', passage: 'Passages', author: 'Authors & works', doctrine: 'Doctrine', catechism: 'Catechism', tag: 'Tags', collection: 'Collections', other: 'Other' };
const KIND_COLOR: Record<NodeKind, string> = { note: '#4a6f8a', question: '#b4631f', passage: '#8a2f39', author: '#6b5b95', doctrine: '#2f7d5b', catechism: '#2f7d5b', tag: '#7a7a6a', collection: '#a07a1c', other: '#999' };
type SNode = GNode & SimulationNodeDatum;
type SLink = SimulationLinkDatum<SNode> & { suggested?: boolean };

/** Your study as a graph: notes, questions, passages, authors, doctrines and tags connected by what you link. It grows as you study. */
export default function GraphPage() {
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const collections = useLiveQuery(() => db.collections.toArray(), []) ?? [];
  const xrefs = useLiveQuery(() => db.userXrefs.toArray(), []) ?? [];
  const [doctrine, setDoctrine] = useState<{ id: string; title: string; scripture: string[] }[]>([]);
  const [suggest, setSuggest] = useState(false);
  const [q, setQ] = useState('');
  const [hidden, setHidden] = useState<Set<NodeKind>>(new Set());
  const [sel, setSel] = useState<string | null>(null);
  const [list, setList] = useState(false);
  useEffect(() => {
    getDoctrine().then((d) => setDoctrine((d?.topics ?? []).map((t) => ({ id: t.id, title: t.title, scripture: t.scripture }))));
  }, []);
  const graph = useMemo(() => buildGraph(notes, collections, xrefs, doctrine, suggest), [notes, collections, xrefs, doctrine, suggest]);
  const visibleIds = useMemo(() => new Set(graph.nodes.filter((n) => !hidden.has(n.kind)).map((n) => n.id)), [graph, hidden]);
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of graph.edges) {
      (m.get(e.a) ?? m.set(e.a, new Set()).get(e.a)!).add(e.b);
      (m.get(e.b) ?? m.set(e.b, new Set()).get(e.b)!).add(e.a);
    }
    return m;
  }, [graph]);
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const lc = q.trim().toLowerCase();
  const matches = useMemo(() => new Set(lc ? graph.nodes.filter((n) => n.label.toLowerCase().includes(lc)).map((n) => n.id) : []), [graph, lc]);

  // force layout (recomputed when the graph changes; positions are cached between renders)
  const [pos, setPos] = useState<Map<string, { x: number; y: number }>>(new Map());
  const W = 900;
  const H = 560;
  useEffect(() => {
    const ns: SNode[] = graph.nodes.filter((n) => visibleIds.has(n.id)).map((n) => ({ ...n }));
    const idx = new Set(ns.map((n) => n.id));
    const ls: SLink[] = graph.edges.filter((e) => idx.has(e.a) && idx.has(e.b)).map((e) => ({ source: e.a, target: e.b, suggested: e.suggested }));
    const sim = forceSimulation(ns)
      .force('link', forceLink<SNode, SLink>(ls).id((d) => d.id).distance(70).strength(0.6))
      .force('charge', forceManyBody().strength(-160))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide<SNode>().radius((d) => 10 + Math.min(d.weight, 8)))
      .stop();
    for (let i = 0; i < 220; i++) sim.tick();
    setPos(new Map(ns.map((n) => [n.id, { x: Math.max(20, Math.min(W - 20, n.x ?? W / 2)), y: Math.max(20, Math.min(H - 20, n.y ?? H / 2)) }])));
  }, [graph, visibleIds]);

  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const chosen = sel ? byId.get(sel) : null;
  const near = chosen ? [...(neighbors.get(chosen.id) ?? [])].map((i) => byId.get(i)!).filter(Boolean) : [];
  const questions = graph.nodes.filter((n) => n.kind === 'question');
  const dim = (id: string) => (lc && !matches.has(id)) || (sel && id !== sel && !(neighbors.get(sel)?.has(id)));

  if (!notes.length && !collections.length)
    return (
      <div className="empty">
        Your knowledge graph is empty. Write notes on passages, Catechism paragraphs or commentary, tag them, and ask questions; connections appear here as you study.
      </div>
    );
  const shown = graph.edges.filter((e: GEdge) => visibleIds.has(e.a) && visibleIds.has(e.b));
  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="search" placeholder="Find in your graph…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find in your graph" style={{ flex: 1, minWidth: 160 }} />
        <label className="row"><input type="checkbox" checked={suggest} onChange={(e) => setSuggest(e.target.checked)} /> Suggest doctrine links</label>
        <button className="btn small" onClick={() => setList(!list)}>{list ? 'Show graph' : 'Show as list'}</button>
      </div>
      <div className="chips" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
        {(Object.keys(KIND_LABEL) as NodeKind[]).filter((k) => graph.nodes.some((n) => n.kind === k)).map((k) => (
          <button key={k} className={`chip${hidden.has(k) ? '' : ' sel'}`} aria-pressed={!hidden.has(k)} onClick={() => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; })}>
            <i style={{ width: 8, height: 8, borderRadius: 99, background: KIND_COLOR[k], display: 'inline-block' }} /> {KIND_LABEL[k]} {graph.nodes.filter((n) => n.kind === k).length}
          </button>
        ))}
      </div>
      <p className="muted small">{visibleIds.size} items, {shown.length} connections{suggest ? ' (dashed lines are suggested links between your passages and doctrine topics; they are not your own)' : ''}. Click an item for details; drag to pan; scroll to zoom.</p>

      {!list ? (
        <svg
          className="graph-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label="Knowledge graph of your notes. A list view is available with the button above."
          onWheel={(e) => setView((v) => ({ ...v, k: Math.max(0.4, Math.min(3, v.k * (e.deltaY < 0 ? 1.1 : 0.9))) }))}
          onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => { if (drag.current) { const dx = e.clientX - drag.current.x; const dy = e.clientY - drag.current.y; drag.current = { x: e.clientX, y: e.clientY }; setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy })); } }}
          onPointerUp={() => { drag.current = null; }}
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {shown.map((e) => {
              const a = pos.get(e.a);
              const b = pos.get(e.b);
              if (!a || !b) return null;
              return <line key={e.a + e.b} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-strong, #b9b0a2)" strokeWidth={1} strokeDasharray={e.suggested ? '4 3' : undefined} opacity={dim(e.a) && dim(e.b) ? 0.15 : 0.7} />;
            })}
            {graph.nodes.filter((n) => visibleIds.has(n.id)).map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const r = 6 + Math.min(n.weight, 8) * 1.2;
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`} opacity={dim(n.id) ? 0.2 : 1} onClick={(ev) => { ev.stopPropagation(); setSel(n.id); }} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={`${KIND_LABEL[n.kind]}: ${n.label}`} onKeyDown={(e) => e.key === 'Enter' && setSel(n.id)}>
                  <circle r={r} fill={KIND_COLOR[n.kind]} stroke={sel === n.id || matches.has(n.id) ? 'var(--text)' : 'var(--surface)'} strokeWidth={sel === n.id || matches.has(n.id) ? 2.5 : 1.5} />
                  <text y={r + 11} textAnchor="middle" fontSize="10" fill="var(--text)">{n.label.length > 26 ? n.label.slice(0, 25) + '…' : n.label}</text>
                </g>
              );
            })}
          </g>
        </svg>
      ) : (
        <ul className="list">
          {graph.nodes.filter((n) => visibleIds.has(n.id)).sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label)).map((n) => (
            <li key={n.id}>
              <button className="linklike" onClick={() => setSel(n.id)}>{n.label}</button> <span className="chip">{KIND_LABEL[n.kind]}</span>
              <span className="muted small"> linked to {[...(neighbors.get(n.id) ?? [])].map((i) => byId.get(i)?.label).filter(Boolean).slice(0, 6).join(', ') || 'nothing yet'}</span>
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="row between"><h2 className="card-title">{chosen.label}</h2><button className="btn small ghost" onClick={() => setSel(null)}>Close</button></div>
          <p className="muted small">{KIND_LABEL[chosen.kind]}{chosen.weight > 1 ? ` · used ${chosen.weight} times` : ''}</p>
          <p className="small">
            {chosen.noteId != null && <Link className="btn small" to={`/library/notes/${chosen.noteId}`}>Open note</Link>}{' '}
            {chosen.kind === 'passage' && chosen.ref && <RefLink id={chosen.ref}><span className="btn small">Read</span></RefLink>}
          </p>
          {near.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem' }}>Connected to</h3>
              <ul className="list">
                {near.map((n) => (
                  <li key={n.id}><button className="linklike" onClick={() => setSel(n.id)}>{n.label}</button> <span className="chip">{KIND_LABEL[n.kind]}</span></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {questions.length > 0 && (
        <div className="card" style={{ marginTop: 10 }}>
          <h2 className="card-title">Open questions</h2>
          <ul className="list">
            {questions.map((n) => (
              <li key={n.id}>
                <button className="linklike" onClick={() => setSel(n.id)}>{n.label}</button>
                <span className="muted small"> {[...(neighbors.get(n.id) ?? [])].map((i) => byId.get(i)?.label).filter(Boolean).slice(0, 3).join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 10 }}>Built on this device from your own notes; nothing is sent anywhere unless you sign in to sync.</p>
    </div>
  );
}
