import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from 'd3-force';
import { getThemes, type Theme } from '../../study/refData';
import { parseRefs } from '../../lib/refs';

interface N extends SimulationNodeDatum { id: string; t: Theme; r: number }
interface E { source: string | N; target: string | N; w: number; related: boolean }

const W = 640, H = 460;
const chapters = (t: Theme) => {
  const out = new Set<string>();
  for (const s of t.stages) {
    const p = parseRefs(s.refs);
    if (!p.ok) continue;
    for (const { ref } of p.refs as { ref: { book: string; c1: number; c2: number } }[]) for (let c = ref.c1; c <= Math.min(ref.c2, ref.c1 + 3); c++) out.add(`${ref.book}.${c}`);
  }
  return out;
};

/** A web of the great themes of Scripture. Lines join themes the Church's tradition ties together or that share passages. */
export default function ConceptsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    getThemes().then((d) => setThemes(d?.themes ?? []));
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodes: N[] = themes.map((t) => ({ id: t.id, t, r: 14 + t.stages.length * 1.6 }));
    const ch = new Map(themes.map((t) => [t.id, chapters(t)]));
    const edges: E[] = [];
    const seen = new Set<string>();
    for (const a of themes) {
      for (const b of themes) {
        if (a.id >= b.id) continue;
        let shared = 0;
        for (const c of ch.get(a.id)!) if (ch.get(b.id)!.has(c)) shared++;
        const rel = a.related.includes(b.id) || b.related.includes(a.id);
        if (shared >= 2 || rel) {
          edges.push({ source: a.id, target: b.id, w: shared + (rel ? 3 : 0), related: rel });
          seen.add(a.id + b.id);
        }
      }
    }
    const sim = forceSimulation(nodes)
      .force('link', forceLink<N, E>(edges).id((n) => n.id).distance((e) => 190 - Math.min(90, e.w * 12)).strength(0.5))
      .force('charge', forceManyBody().strength(-520))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide<N>().radius((n) => n.r + 26))
      .stop();
    for (let i = 0; i < 400; i++) sim.tick();
    for (const n of nodes) {
      n.x = Math.max(60, Math.min(W - 60, n.x ?? W / 2));
      n.y = Math.max(40, Math.min(H - 40, n.y ?? H / 2));
    }
    return { nodes, edges };
  }, [themes]);

  const cur = themes.find((t) => t.id === sel);
  const linked = new Set<string>();
  if (sel) for (const e of edges) { const s = (e.source as N).id, t = (e.target as N).id; if (s === sel) linked.add(t); if (t === sel) linked.add(s); }
  return (
    <div className="page">
      <h1>Web of themes</h1>
      <p className="lede">Fifteen threads that run through the whole Bible. Bold lines are links the Church's tradition draws between themes; faint lines are themes that share passages. Choose one to see where it leads.</p>
      <div className="constellation">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Web of Scripture's themes">
          {edges.map((e, i) => {
            const s = e.source as N, t = e.target as N;
            const on = sel && (s.id === sel || t.id === sel);
            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="var(--accent)" strokeWidth={e.related ? 2 : 1} opacity={sel ? (on ? 0.8 : 0.08) : e.related ? 0.5 : 0.2} />;
          })}
          {nodes.map((n) => {
            const on = sel === n.id || linked.has(n.id);
            return (
              <g key={n.id} tabIndex={0} role="button" aria-label={n.t.title} aria-pressed={sel === n.id} style={{ cursor: 'pointer' }} onClick={() => setSel(sel === n.id ? null : n.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(sel === n.id ? null : n.id)}>
                <circle cx={n.x} cy={n.y} r={n.r} fill="var(--accent)" opacity={sel && !on ? 0.25 : sel === n.id ? 1 : 0.75} />
                <text x={n.x} y={n.y! + n.r + 14} textAnchor="middle" fontSize="12" fill="var(--text)" opacity={sel && !on ? 0.4 : 1}>{n.t.title.split(' and ')[0]}</text>
              </g>
            );
          })}
        </svg>
        <aside className="constellation-side" aria-live="polite">
          {cur ? (
            <>
              <h2>{cur.title}</h2>
              <p>{cur.summary}</p>
              {linked.size > 0 && (
                <p className="muted small">
                  Joined to: {[...linked].map((id) => <button key={id} className="linklike" style={{ marginRight: 8 }} onClick={() => setSel(id)}>{themes.find((t) => t.id === id)?.title.split(' and ')[0]}</button>)}
                </p>
              )}
              <Link className="btn" to={`/study/themes?t=${cur.id}`}>Follow it through Scripture</Link>
            </>
          ) : (
            <p className="muted">Nothing chosen. The larger a circle, the more stages the theme has in the explorer.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
