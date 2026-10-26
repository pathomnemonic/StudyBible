import { useEffect, useMemo, useRef, useState } from 'react';
import { getGenealogies, type Genealogies, type Person } from '../../study/refData';
import FilterBar from '../../components/FilterBar';
import RefChips from '../../components/RefChips';

const ROOTS: [string, string][] = [['adam', 'Adam'], ['noah', 'Noah'], ['abraham', 'Abraham'], ['isaac', 'Isaac'], ['jacob', 'Jacob (the twelve tribes)'], ['judah', 'Judah'], ['levi', 'Levi (Moses and Aaron)'], ['david', 'David']];
const W = 128;
const H = 54;
const GX = 14;
const GY = 46;

interface Node {
  p: Person;
  x: number;
  y: number;
  kids: Node[];
}

/** Family trees and the genealogies of Jesus (editorial index built from the genealogies of Scripture). */
export default function PeoplePage() {
  const [data, setData] = useState<Genealogies | null>(null);
  const [root, setRoot] = useState('abraham');
  const [sel, setSel] = useState<string | null>(null);
  const [hl, setHl] = useState(true);
  const [view, setView] = useState<'outline' | 'tree' | 'matthew' | 'luke'>(() => (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 760px)').matches ? 'outline' : 'tree'));
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    getGenealogies().then(setData);
  }, []);
  const byId = useMemo(() => new Map((data?.persons ?? []).map((p) => [p.id, p])), [data]);
  const mtSet = useMemo(() => new Set(data?.lines.matthew.groups.flatMap((g) => g[1]) ?? []), [data]);

  const layout = useMemo(() => {
    if (!data) return null;
    const kidsOf = new Map<string, Person[]>();
    for (const p of data.persons) if (p.f) (kidsOf.get(p.f) ?? kidsOf.set(p.f, []).get(p.f)!).push(p);
    let leaf = 0;
    let maxDepth = 0;
    const build = (p: Person, depth: number): Node => {
      maxDepth = Math.max(maxDepth, depth);
      const kids = (kidsOf.get(p.id) ?? []).map((k) => build(k, depth + 1));
      const x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : leaf++ * (W + GX);
      return { p, x, y: depth * (H + GY), kids };
    };
    const r = byId.get(root);
    if (!r) return null;
    const tree = build(r, 0);
    return { tree, width: Math.max(leaf, 1) * (W + GX), height: (maxDepth + 1) * (H + GY) };
  }, [data, root, byId]);

  useEffect(() => {
    const el = scroller.current;
    if (el && layout) el.scrollLeft = Math.max(0, layout.tree.x + W / 2 - el.clientWidth / 2);
  }, [layout, view]);

  const nodes: Node[] = [];
  const edges: [Node, Node][] = [];
  const walk = (n: Node) => {
    nodes.push(n);
    for (const k of n.kids) {
      edges.push([n, k]);
      walk(k);
    }
  };
  if (layout) walk(layout.tree);
  const chosen = sel ? byId.get(sel) : null;
  const kidsOfSel = chosen ? (data?.persons ?? []).filter((p) => p.f === chosen.id) : [];

  return (
    <div className="page wide">
      <h1>Genealogies and family trees</h1>
      <p className="lede">From Adam to Jesus: the family lines of Scripture. Where the lists differ, the differences are noted, not resolved.</p>
      <div className="segmented" role="tablist" style={{ marginBottom: 12 }}>
        <button role="tab" aria-selected={view === 'outline'} onClick={() => setView('outline')}>Outline</button>
        <button role="tab" aria-selected={view === 'tree'} onClick={() => setView('tree')}>Family tree</button>
        <button role="tab" aria-selected={view === 'matthew'} onClick={() => setView('matthew')}>Matthew 1</button>
        <button role="tab" aria-selected={view === 'luke'} onClick={() => setView('luke')}>Luke 3</button>
      </div>

      {(view === 'tree' || view === 'outline') && (
        <>
          <FilterBar active={0}
            search={<label className="fb-inline">Start from <select value={root} onChange={(e) => { setRoot(e.target.value); setSel(null); setOpenIds(new Set()); }} aria-label="Start from">{ROOTS.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>}>
            <label className="row small" style={{ gap: 8 }}><input type="checkbox" checked={hl} onChange={(e) => setHl(e.target.checked)} /> <span>Highlight the line to Jesus (Matthew 1)</span></label>
          </FilterBar>
          {view === 'outline' && layout && <ul className="gen-outline" aria-label={`Descendants of ${byId.get(root)?.n}`}><OutlineNode n={layout.tree} depth={0} openIds={openIds} setOpenIds={setOpenIds} sel={sel} setSel={setSel} hl={hl} mt={mtSet} byId={byId} /></ul>}
          {view === 'tree' && <>
          <div className="tree-scroll" ref={scroller} tabIndex={0} aria-label="Family tree; scroll to explore">
            {layout && (
              <svg width={layout.width + 20} height={layout.height + 10} role="group" aria-label={`Descendants of ${byId.get(root)?.n}`}>
                <g transform="translate(10,5)">
                  {edges.map(([a, b]) => (
                    <path key={a.p.id + b.p.id} d={`M${a.x + W / 2},${a.y + H} C${a.x + W / 2},${a.y + H + GY / 2} ${b.x + W / 2},${b.y - GY / 2} ${b.x + W / 2},${b.y}`} fill="none" stroke={hl && mtSet.has(a.p.id) && mtSet.has(b.p.id) ? 'var(--accent)' : 'var(--border-strong, #b9b0a2)'} strokeWidth={hl && mtSet.has(a.p.id) && mtSet.has(b.p.id) ? 2.5 : 1.2} />
                  ))}
                  {nodes.map((n) => (
                    <g key={n.p.id} transform={`translate(${n.x},${n.y})`} onClick={() => setSel(n.p.id)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={n.p.n} onKeyDown={(e) => e.key === 'Enter' && setSel(n.p.id)}>
                      <rect width={W} height={H} rx={8} fill={sel === n.p.id ? 'var(--accent-soft)' : 'var(--surface)'} stroke={hl && mtSet.has(n.p.id) ? 'var(--accent)' : 'var(--border)'} strokeWidth={hl && mtSet.has(n.p.id) ? 2 : 1} />
                      <text x={W / 2} y={H / 2 - 2} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">{n.p.n.length > 22 ? n.p.n.slice(0, 21) + '…' : n.p.n}</text>
                      {n.p.m && <text x={W / 2} y={H / 2 + 14} textAnchor="middle" fontSize="10" fill="var(--text-2)">{`m. ${byId.get(n.p.m)?.n.split(' ')[0] ?? ''}`}</text>}
                    </g>
                  ))}
                </g>
              </svg>
            )}
          </div>
          </>}
          {chosen && (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="row between"><h2 className="card-title">{chosen.n}</h2><button className="btn small ghost" onClick={() => setSel(null)}>Close</button></div>
              <p className="small" style={{ margin: '4px 0' }}>
                {chosen.f && <>Father: {byId.get(chosen.f)?.n}. </>}
                {chosen.m && <>Mother: {byId.get(chosen.m)?.n}. </>}
                {kidsOfSel.length > 0 && <>Children in this list: {kidsOfSel.map((k) => k.n).join(', ')}.</>}
              </p>
              {chosen.note && <p className="small">{chosen.note}</p>}
              {chosen.r && <p className="small">Passages: <RefChips text={chosen.r} /></p>}
            </div>
          )}
        </>
      )}

      {view === 'matthew' && data && (
        <div className="card">
          <h2 className="card-title">{data.lines.matthew.title}</h2>
          <p className="muted small">{data.lines.matthew.note}</p>
          {data.lines.matthew.groups.map(([title, ids]) => (
            <div key={title}>
              <h3 style={{ margin: '12px 0 4px' }}>{title}</h3>
              <ol className="list" style={{ paddingLeft: 20, columns: 2 }}>
                {ids.map((id) => <li key={id}>{byId.get(id)?.n}</li>)}
              </ol>
            </div>
          ))}
          <p className="muted small">Matthew traces the legal line through Joseph; he names four women (Tamar, Rahab, Ruth and the wife of Uriah) before Mary.</p>
        </div>
      )}
      {view === 'luke' && data && (
        <div className="card">
          <h2 className="card-title">{data.lines.luke.title}</h2>
          <p className="muted small">Luke goes backwards from Jesus to “Adam, the son of God.” From David on, the names differ from Matthew’s list (Luke follows David’s son Nathan). “Cainan” appears after Arphaxad in Luke and the Greek Old Testament, but not in the Hebrew text of Genesis 11.</p>
          <ol className="list" style={{ paddingLeft: 24, columns: 2 }}>
            {data.lines.luke.names.map((n, i) => <li key={i}>{n}</li>)}
          </ol>
        </div>
      )}
      <p className="muted small">Editorial index written for this app. Each person lists the passages where they appear; family relationships come from the biblical lists. Names follow the Douay-Rheims or the common English forms.</p>
    </div>
  );
}

function OutlineNode({ n, depth, openIds, setOpenIds, sel, setSel, hl, mt, byId }: { n: Node; depth: number; openIds: Set<string>; setOpenIds: (s: Set<string>) => void; sel: string | null; setSel: (id: string | null) => void; hl: boolean; mt: Set<string>; byId: Map<string, Person> }) {
  const open = openIds.has(n.p.id) || depth === 0;
  const flip = () => { const x = new Set(openIds); x.has(n.p.id) ? x.delete(n.p.id) : x.add(n.p.id); setOpenIds(x); };
  const line = hl && mt.has(n.p.id);
  return (
    <li className={`gen-node${line ? ' line' : ''}`}>
      <div className="gen-row" style={{ paddingLeft: depth * 14 }}>
        {n.kids.length > 0 ? <button className="gen-tog" aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} children of ${n.p.n}`} onClick={flip}>{open ? '▾' : '▸'}</button> : <span className="gen-tog dot">·</span>}
        <button className="gen-name" onClick={() => setSel(sel === n.p.id ? null : n.p.id)} aria-pressed={sel === n.p.id}>{n.p.n}{n.p.m ? <small> m. {byId.get(n.p.m)?.n.split(' ')[0]}</small> : null}{line && <span className="gen-star" title="In Jesus’ line (Matthew 1)"> ★</span>}</button>
        {n.kids.length > 0 && <span className="muted small">{n.kids.length}</span>}
      </div>
      {sel === n.p.id && (
        <div className="gen-detail" style={{ marginLeft: depth * 14 + 26 }}>
          {n.p.f && <p>Father: {byId.get(n.p.f)?.n}.{n.p.m ? ` Mother: ${byId.get(n.p.m)?.n}.` : ''}</p>}
          {n.p.note && <p>{n.p.note}</p>}
          {n.p.r && <p>Passages: <RefChips text={n.p.r} /></p>}
        </div>
      )}
      {open && n.kids.length > 0 && <ul>{n.kids.map((k) => <OutlineNode key={k.p.id} n={k} depth={depth + 1} openIds={openIds} setOpenIds={setOpenIds} sel={sel} setSel={setSel} hl={hl} mt={mt} byId={byId} />)}</ul>}
    </li>
  );
}
