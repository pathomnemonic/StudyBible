import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { VISUALS as BASE, type Node, type Visual } from '../../data/visuals';
import { MORE_VISUALS } from '../../data/visuals2';

const VISUALS: Visual[] = [...BASE, ...MORE_VISUALS];
/** which topic each diagram sits under, so the strip of tabs stays short */
const TOPIC: Record<string, string> = {
  trinity: 'Faith', creed: 'Faith', pillars: 'Faith', lastthings: 'Faith', mary: 'Faith',
  sacraments: 'Worship', mass: 'Worship', year: 'Worship', triduum: 'Worship', church: 'Worship', confession: 'Worship', orders: 'Worship', marriage: 'Worship',
  commandments: 'Living it', virtues: 'Living it', beatitudes: 'Living it', sins: 'Living it', mortalsin: 'Living it', mercy: 'Living it',
  prayer: 'Prayer', rosary: 'Prayer',
  salvation: 'Scripture and history', canon: 'Scripture and history', gospels: 'Scripture and history', councils: 'Scripture and history', history: 'Scripture and history',
  marks: 'The Church', hierarchy: 'The Church',
};
const TOPICS = ['Faith', 'Worship', 'Living it', 'Prayer', 'Scripture and history', 'The Church'];

const COLORS = ['#5b4bd6', '#b0501a', '#1c6f69', '#b0355a', '#3a7226', '#7d6208', '#2a62a0'];
const cccLink = (s: string) => `/study/catechism/${parseInt(s, 10)}`;

function Detail({ n }: { n: Node | undefined }) {
  if (!n) return <div className="vis-detail muted" aria-live="polite">Tap any part of the diagram.</div>;
  return (
    <div className="vis-detail" aria-live="polite">
      <h3>{n.label}{n.when ? <span className="muted small"> · {n.when}</span> : null}</h3>
      <p>{n.detail}</p>
      {n.ccc && <p className="small"><Link to={cccLink(n.ccc)}>Catechism {n.ccc}</Link></p>}
    </div>
  );
}

function Wheel({ v, sel, set }: { v: Visual; sel: string; set: (id: string) => void }) {
  const n = v.nodes.length, R = 118, r = 38;
  return (
    <svg className="vis-svg" viewBox="-170 -170 340 340" role="group" aria-label={v.title}>
      <circle r={R + 30} fill="none" stroke="var(--border)" strokeDasharray="3 5" />
      {v.nodes.map((nd, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2, x = Math.cos(a) * R, y = Math.sin(a) * R, on = nd.id === sel;
        return (
          <g key={nd.id} transform={`translate(${x},${y})`} role="button" tabIndex={0} aria-pressed={on} className={`vis-node${on ? ' on' : ''}`} onClick={() => set(nd.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), set(nd.id))}>
            <circle r={on ? r + 4 : r} fill={COLORS[i % COLORS.length]} opacity={on ? 1 : 0.85} />
            <text textAnchor="middle" y={-2} className="vis-t">{nd.label.length > 13 ? nd.label.split(' ')[0] : nd.label}</text>
            {nd.short && <text textAnchor="middle" y={12} className="vis-s">{nd.short}</text>}
          </g>
        );
      })}
      <circle r={42} fill="var(--surface-2)" stroke="var(--border-strong)" />
      <text textAnchor="middle" y={5} className="vis-c">{v.center}</text>
    </svg>
  );
}

function Trinity({ v, sel, set }: { v: Visual; sel: string; set: (id: string) => void }) {
  const P: Record<string, [number, number]> = { father: [0, -105], son: [-100, 70], spirit: [100, 70] };
  const links: [string, string, string][] = [['father', 'son', 'is not'], ['son', 'spirit', 'is not'], ['spirit', 'father', 'is not']];
  return (
    <svg className="vis-svg" viewBox="-170 -170 340 340" role="group" aria-label="The Holy Trinity">
      {links.map(([a, b, t]) => <g key={a + b}><line x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke="var(--border-strong)" strokeWidth={2} /><text x={(P[a][0] + P[b][0]) / 2} y={(P[a][1] + P[b][1]) / 2 - 4} textAnchor="middle" className="vis-s" fill="var(--muted)">{t}</text></g>)}
      {Object.values(P).map(([x, y], k) => <line key={k} x1={0} y1={0} x2={x} y2={y} stroke="var(--accent)" strokeWidth={2} strokeDasharray="2 4" />)}
      <circle r={38} fill="var(--surface-2)" stroke="var(--accent)" strokeWidth={3} /><text textAnchor="middle" y={5} className="vis-c">GOD</text>
      {v.nodes.map((nd, i) => {
        const [x, y] = P[nd.id], on = sel === nd.id;
        return (
          <g key={nd.id} transform={`translate(${x},${y})`} role="button" tabIndex={0} aria-label={nd.label} aria-pressed={on} className={`vis-node${on ? ' on' : ''}`} onClick={() => set(nd.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), set(nd.id))}>
            <circle r={on ? 46 : 42} fill={COLORS[i]} /><text textAnchor="middle" y={4} className="vis-t">{nd.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Flow({ v, sel, set }: { v: Visual; sel: string; set: (id: string) => void }) {
  return (
    <ol className="vis-flow">
      {v.nodes.map((nd, i) => (
        <li key={nd.id}><button className={sel === nd.id ? 'on' : ''} aria-pressed={sel === nd.id} onClick={() => set(nd.id)} style={{ ['--c' as string]: COLORS[i % COLORS.length] }}><span className="vis-n">{i + 1}</span>{nd.label}</button></li>
      ))}
    </ol>
  );
}

function Timeline({ v, sel, set }: { v: Visual; sel: string; set: (id: string) => void }) {
  return (
    <div className="vis-time" role="group" aria-label={v.title}>
      <div className="vis-rail">
        {v.nodes.map((nd, i) => (
          <button key={nd.id} className={sel === nd.id ? 'on' : ''} aria-pressed={sel === nd.id} onClick={() => set(nd.id)} style={{ ['--c' as string]: COLORS[i % COLORS.length] }}>
            <i aria-hidden /><b>{nd.label}</b><span>{nd.when}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Columns({ v, sel, set }: { v: Visual; sel: string; set: (id: string) => void }) {
  const groups = v.groups ?? [{ title: '', ids: v.nodes.map((n) => n.id) }];
  return (
    <div className="vis-cols">
      {groups.map((g, gi) => (
        <section key={g.title || gi}>
          {g.title && <h3>{g.title}</h3>}
          <div className="vis-chips">
            {g.ids.map((id) => { const nd = v.nodes.find((x) => x.id === id)!; const i = v.nodes.indexOf(nd); return <button key={id} className={sel === id ? 'on' : ''} aria-pressed={sel === id} onClick={() => set(id)} style={{ ['--c' as string]: COLORS[(gi * 3 + i) % COLORS.length] }}>{nd.label}{nd.short && <small>{nd.short}</small>}</button>; })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Visual Catechism: the faith drawn as diagrams you can tap, each tied to Catechism paragraphs. */
export default function VisualPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const v = useMemo(() => VISUALS.find((x) => x.id === id) ?? VISUALS[0], [id]);
  const [sel, setSel] = useState('');
  const topic = TOPIC[v.id] ?? 'Faith';
  const inTopic = VISUALS.filter((x) => (TOPIC[x.id] ?? 'Faith') === topic);
  const pick = (to: string) => { setSel(''); nav(`/study/visual/${to}`); };
  const node = v.nodes.find((n) => n.id === sel);
  const Body = v.kind === 'wheel' ? Wheel : v.kind === 'trinity' ? Trinity : v.kind === 'flow' ? Flow : v.kind === 'timeline' ? Timeline : Columns;
  return (
    <div className="page vis-page">
      <h1>Visual Catechism</h1>
      <p className="lede">The faith as diagrams. Tap any part to see what the Church teaches and where to read more.</p>
      <div className="vis-topics" role="group" aria-label="Topics">
        {TOPICS.map((t) => <button key={t} className={`chip${t === topic ? ' sel' : ''}`} aria-pressed={t === topic} onClick={() => pick(VISUALS.find((x) => (TOPIC[x.id] ?? 'Faith') === t)!.id)}>{t}</button>)}
      </div>
      <div className="vis-tabs" role="tablist" aria-label="Diagrams">
        {inTopic.map((x) => <button key={x.id} role="tab" aria-selected={x.id === v.id} className={x.id === v.id ? 'on' : ''} onClick={() => pick(x.id)}>{x.title}</button>)}
      </div>
      <h2>{v.title}</h2>
      <p className="muted">{v.blurb}</p>
      <div className="vis-stage"><Body v={v} sel={sel} set={setSel} /></div>
      <Detail n={node} />
      {v.note && <p className="muted small">{v.note}</p>}
    </div>
  );
}
