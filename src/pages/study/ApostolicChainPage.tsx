import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import data from '../../data/apostolicChain.json';
import { getJson } from '../../data/loader';
import { contextLink } from '../../chains/links';
import type { Step } from '../../chains/types';

interface Node { id: string; branch: string; name: string; years: string; from: number; to: number; role: string; place: string; authorId?: string; read?: { work: string; section?: string; label: string }; words?: { quote: string; work: string; section: string; note: string }[] }
interface Edge { from: string; to: string; kind: string; quote: string; work?: string; section?: string; ref?: string; voice: string; disputed?: boolean; note: string }
const nodes = data.nodes as Node[];
const edges = data.edges as Edge[];
const traditional = data.traditional as { from: string; to: string; note: string }[];
const byId = new Map(nodes.map((n) => [n.id, n]));

const BRANCHES: { id: string; name: string }[] = [
  { id: 'paul', name: 'Paul and his co-workers' }, { id: 'rome', name: 'Peter and Rome' }, { id: 'asia', name: 'John and Asia Minor' },
  { id: 'apol', name: 'The apologists' }, { id: 'alex', name: 'Alexandria and Caesarea' }, { id: 'africa', name: 'North Africa' },
  { id: 'cappa', name: 'The Cappadocians and Jerome' }, { id: 'west', name: 'Milan and Hippo' },
];
const KIND_LABEL: Record<string, string> = { taught: 'Taught', heard: 'Heard', succeeded: 'Succeeded', 'wrote-to': 'Wrote to', 'wrote-about': 'Wrote about' };
const VOICE: Record<string, string> = { text: 'The writer’s own words', editor: 'An editor’s note in our edition', scripture: 'Scripture' };
const CENTURIES = [1, 2, 3, 4, 5];
const active = (n: Node, c: number) => n.from <= c * 100 && n.to >= (c - 1) * 100;

const LANE_H = 74, PAD_X = 12, TOP = 8, NODE_W = 124, STEP = 140;
function layout() {
  // column = how many hands from the apostles, but never earlier than the person's own time
  const order = [...nodes].sort((a, c) => a.from + a.to - (c.from + c.to));
  const col = new Map<string, number>();
  for (const n of order) {
    let c = Math.floor(Math.max(0, (n.from + n.to) / 2) / 60);
    for (const e of edges) if (e.to === n.id && ['taught', 'heard', 'succeeded'].includes(e.kind) && col.has(e.from)) c = Math.max(c, col.get(e.from)! + 1);
    col.set(n.id, c);
  }
  const pos = new Map<string, { x: number; y: number }>();
  let width = 0;
  BRANCHES.forEach((b, li) => {
    const list = nodes.filter((n) => n.branch === b.id).sort((a, c) => col.get(a.id)! - col.get(c.id)! || a.from - c.from);
    let last = -1e9;
    for (const n of list) {
      let x = PAD_X + col.get(n.id)! * STEP;
      if (x < last + STEP) x = last + STEP;
      last = x; pos.set(n.id, { x, y: TOP + li * LANE_H }); width = Math.max(width, x + NODE_W + PAD_X);
    }
  });
  return { pos, width, height: TOP + BRANCHES.length * LANE_H };
}
const L = layout();

function headline(e: Edge, other: string, who: 'in' | 'out') {
  const m: Record<string, [string, string]> = {
    taught: [`Taught by ${other}`, `Taught ${other}`], heard: [`Heard ${other}`, `Was heard by ${other}`],
    succeeded: [`Succeeded ${other}`, `Followed in office by ${other}`], 'wrote-to': [`Letter from ${other}`, `Wrote to ${other}`], 'wrote-about': [`Written about by ${other}`, `Wrote about ${other}`],
  };
  return <strong>{m[e.kind][who === 'in' ? 0 : 1]}</strong>;
}
function EdgeCard({ e, who }: { e: Edge; who: 'in' | 'out' }) {
  const other = byId.get(who === 'in' ? e.from : e.to)!;
  const step: Step = { kind: e.ref ? 'scripture' : 'father', label: '', work: e.work, section: e.section, ref: e.ref, note: '' } as Step;
  const link = contextLink(step);
  return (
    <li className="ap-edge">
      <p className="ap-edge-h">{headline(e, other.name, who)}{e.disputed && <span className="ap-badge warn">Disputed</span>}</p>
      <blockquote className="ap-quote"><p>{e.quote}</p></blockquote>
      <p className="ap-note">{e.note}</p>
      <p className="ap-meta"><span className={`ap-badge v-${e.voice}`}>{VOICE[e.voice]}</span>{link && <Link to={link.to}>{link.text}</Link>}</p>
    </li>
  );
}

function Detail({ n, select, works }: { n: Node; select: (id: string) => void; works: { id: string; title: string }[] }) {
  const inc = edges.filter((e) => e.to === n.id), out = edges.filter((e) => e.from === n.id);
  const tin = traditional.filter((t) => t.to === n.id), tout = traditional.filter((t) => t.from === n.id);
  return (
    <section className="ap-detail card" aria-live="polite">
      <h2>{n.name}</h2>
      <p className="ap-years">{n.years} · {n.place}</p>
      <p>{n.role}</p>
      {n.read && <p><Link className="btn small" to={`/room/work/${n.read.work}/${n.read.section ?? ''}`}>Read: {n.read.label}</Link></p>}
      {works.length > 0 && <p className="ap-works small">In the library: {works.map((w, i) => <span key={w.id}>{i > 0 && ' · '}<Link to={`/room/work/${w.id}`}>{w.title}</Link></span>)}</p>}
      <h3>Who this person is linked to</h3>
      {inc.length + out.length === 0 && <p className="muted">No sourced links.</p>}
      {inc.length > 0 && <><h4 className="ap-h4">Links that come to {n.name}</h4><ul className="ap-edges">{inc.map((e, i) => <EdgeCard key={i} e={e} who="in" />)}</ul></>}
      {out.length > 0 && <><h4 className="ap-h4">Links that go from {n.name}</h4><ul className="ap-edges">{out.map((e, i) => <EdgeCard key={i} e={e} who="out" />)}</ul></>}
      {n.words && n.words.length > 0 && <><h4 className="ap-h4">In their own words</h4>{n.words.map((w, i) => <blockquote key={i} className="ap-quote"><p>{w.quote}</p><p className="ap-note">{w.note}</p></blockquote>)}</>}
      {(tin.length > 0 || tout.length > 0) && (
        <div className="ap-trad"><h4 className="ap-h4">Traditional, not in our sources</h4>
          <ul>{[...tin, ...tout].map((t, i) => <li key={i}><button className="linklike" onClick={() => select(t.from === n.id ? t.to : t.from)}>{byId.get(t.from)!.name} and {byId.get(t.to)!.name}</button>: {t.note}</li>)}</ul></div>
      )}
    </section>
  );
}

export default function ApostolicChainPage() {
  const [sp, setSp] = useSearchParams();
  const sel = sp.get('p') && byId.has(sp.get('p')!) ? sp.get('p')! : '';
  const [century, setCentury] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [lib, setLib] = useState<{ id: string; title: string; authorId: string }[]>([]);
  useEffect(() => { getJson<{ works: { id: string; title: string; authorId: string }[] }>('library/index.json').then((j) => j && setLib(j.works)); }, []);
  const select = (id: string) => setSp(id ? { p: id } : {}, { replace: true });
  const node = sel ? byId.get(sel)! : null;
  const works = useMemo(() => (node?.authorId ? lib.filter((w) => w.authorId === node.authorId) : []), [node, lib]);
  const related = useMemo(() => new Set(node ? [node.id, ...edges.filter((e) => e.from === node.id || e.to === node.id).flatMap((e) => [e.from, e.to])] : []), [node]);
  const dim = (n: Node) => (century && !active(n, century)) || (node && !related.has(n.id));
  const isOpen = (id: string) => open[id] ?? (!!node && nodes.some((n) => n.branch === id && n.id === node.id)) ?? false;

  const path = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const x1 = a.x + NODE_W, y1 = a.y + 20, x2 = b.x, y2 = b.y + 20;
    if (x2 < x1 + 6) { const mx = (a.x + b.x + NODE_W) / 2; return `M${a.x + NODE_W / 2},${a.y + 40} C${mx},${a.y + 60} ${mx},${b.y - 6} ${b.x + NODE_W / 2},${b.y} `; }
    const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <div className="page ap-page">
      <h1>The apostolic chain</h1>
      <p className="lead">Who taught whom, in the words of the old writers. Each line on the chart carries a quotation that our tests find in the library text it cites. We do not say a link is certain. We show what each source says.</p>
      <p className="small muted">Dashed lines are traditional links that no text in our library states. Two kinds of source appear: the early writer’s own words, and notes by the modern editors of our editions. Each is labelled.</p>

      <div className="ap-cent" role="group" aria-label="Filter by century">
        <button className={`chip${century === 0 ? ' on' : ''}`} aria-pressed={century === 0} onClick={() => setCentury(0)}>All centuries</button>
        {CENTURIES.map((c) => <button key={c} className={`chip${century === c ? ' on' : ''}`} aria-pressed={century === c} onClick={() => setCentury(century === c ? 0 : c)}>{c === 1 ? '1st' : c === 2 ? '2nd' : c === 3 ? '3rd' : c + 'th'} century <span className="muted">({nodes.filter((n) => active(n, c)).length})</span></button>)}
      </div>

      <div className="ap-wide">
        <p className="small muted">Columns run left to right through time. Scroll the chart sideways. Tap a person to bring their links forward; letters and writings about people show only then.</p>
        <div className="ap-scroll" tabIndex={0} aria-label="Chart of teachers and pupils. Scrolls sideways.">
          <div className="ap-canvas" style={{ width: L.width + 120, height: L.height + 28 }}>
            {BRANCHES.map((b, i) => <div key={b.id} className="ap-lane-label" style={{ top: 28 + TOP + i * LANE_H }}>{b.name}</div>)}
            <svg className="ap-svg" width={L.width + 120} height={L.height + 28} aria-hidden="true">
              <defs><marker id="ap-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" /></marker></defs>
              <g transform="translate(110,28)">
                {traditional.map((t, i) => { const a = L.pos.get(t.from)!, b = L.pos.get(t.to)!; return <path key={'t' + i} d={path(a, b)} className="ap-line trad" markerEnd="url(#ap-arr)" opacity={node && !(related.has(t.from) && related.has(t.to)) ? 0.1 : 0.7} />; })}
                {edges.map((e, i) => { const a = L.pos.get(e.from)!, b = L.pos.get(e.to)!; const hot = node && (e.from === node.id || e.to === node.id); return <path key={i} d={path(a, b)} className={`ap-line k-${e.kind}${hot ? ' hot' : ''}`} markerEnd="url(#ap-arr)" opacity={node ? (hot ? 0.95 : 0.06) : e.kind.startsWith('wrote') ? 0.18 : 0.7} />; })}
              </g>
            </svg>
            {nodes.map((n) => { const p = L.pos.get(n.id)!; return (
              <button key={n.id} className={`ap-node${sel === n.id ? ' sel' : ''}${dim(n) ? ' dim' : ''}`} style={{ left: 110 + p.x, top: 28 + p.y, width: NODE_W }} onClick={() => select(sel === n.id ? '' : n.id)} aria-pressed={sel === n.id}>
                <span className="ap-n-name">{n.name}</span><span className="ap-n-yrs">{n.years}</span>
              </button>); })}
          </div>
        </div>
        <p className="ap-legend small">
          <span className="lg k-taught">Taught</span><span className="lg k-heard">Heard</span><span className="lg k-succeeded">Succeeded</span><span className="lg k-wrote-to">Wrote to</span><span className="lg k-wrote-about">Wrote about</span><span className="lg trad">Traditional, no source</span>
        </p>
      </div>

      <div className="ap-narrow">
        {BRANCHES.map((b) => {
          const list = nodes.filter((n) => n.branch === b.id).sort((x, y) => x.from + x.to - (y.from + y.to));
          return (
            <details key={b.id} className="ap-branch" open={isOpen(b.id)} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen((s) => (s[b.id] === o ? s : { ...s, [b.id]: o })); }}>
              <summary>{b.name} <span className="muted">({list.length})</span></summary>
              <ol className="ap-list">
                {list.map((n) => <li key={n.id}><button className={`ap-item${sel === n.id ? ' sel' : ''}${dim(n) ? ' dim' : ''}`} onClick={() => select(sel === n.id ? '' : n.id)} aria-pressed={sel === n.id}><strong>{n.name}</strong><span className="muted"> {n.years}</span></button></li>)}
              </ol>
            </details>
          );
        })}
      </div>

      {node ? <Detail n={node} select={select} works={works} /> : <p className="card ap-hint">Tap a person to see who taught them, whom they taught, and the quotation behind each link.</p>}

      <p className="small muted ap-foot">About the sources. Jerome’s Lives of Illustrious Men reaches us here as a list of names and editors’ notes, so it supports only one link. The text of Clement of Rome’s chapters 42 and 44 is cut short by footnote marks in our copy. We left out any link we could not find in a bundled text. Dates are rounded and, where the sources do not give them, follow common scholarly reckoning.</p>
    </div>
  );
}
