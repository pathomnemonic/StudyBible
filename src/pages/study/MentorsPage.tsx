import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadSituations } from '../../chains/load';
import { contextLink } from '../../chains/links';
import type { Situation } from '../../chains/types';
import ShareLinkButton from '../../components/ShareLinkButton';
import PrintButton from '../../components/PrintButton';

/** Holy men and women the Church has not canonized: shown as examples, not called saints. */
const NOT_CANONIZED = ['Brother Lawrence', 'Julian of Norwich', 'Thomas à Kempis', 'Walter Hilton'];

/** Saints who faced what you are facing, with their own words, matched by situation and not by feast day. */
export default function MentorsPage() {
  const { id } = useParams();
  const [list, setList] = useState<Situation[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { loadSituations().then(setList); }, []);
  if (!list) return <div className="page"><p className="center-note">Loading…</p></div>;
  const s = id ? list.find((x) => x.id === id) : undefined;
  if (s) {
    return (
      <div className="page mentors">
        <p className="small no-print"><Link to="/study/mentors">← Saints for what you’re facing</Link></p>
        <h1>{s.title} <PrintButton /></h1>
        <p className="lede">“{s.ask}”</p>
        <p>{s.intro}</p>
        <ul className="mentor-list">
          {s.mentors.map((m) => {
            const link = contextLink(m.step);
            return (
              <li key={m.name} className="card mentor">
                <h2 className="mentor-name">{m.name} <span className="muted small">{m.lifespan}</span>{NOT_CANONIZED.some((n) => m.name.includes(n)) && <span className="mentor-tag">holy example, not canonized</span>}</h2>
                <p>{m.why}</p>
                {m.step.quote && <blockquote className="chain-quote"><p>{m.step.quote}</p></blockquote>}
                <p className="small muted" style={{ margin: 0 }}>{m.step.label}. {m.step.note}</p>
                {link && <p className="small no-print"><Link to={link.to}>{link.text}</Link></p>}
              </li>
            );
          })}
        </ul>
        {s.readNext && s.readNext.length > 0 && <p className="small">In the Catechism: {s.readNext.map((n, i) => <span key={n}>{i > 0 && ', '}<Link to={`/study/catechism/${n}`}>§{n}</Link></span>)}</p>}
        <p className="no-print"><ShareLinkButton path={`/study/mentors/${s.id}`} title={s.title} /></p>
        <p className="muted small">Quotations are checked against the text of the source, which is built into this app. A saint’s story is a companion, not a treatment; if you are in crisis or unsafe, please also reach out to someone you trust or a local emergency or crisis line.</p>
      </div>
    );
  }
  const f = q.trim().toLowerCase();
  const shown = list.filter((x) => !f || `${x.title} ${x.ask}`.toLowerCase().includes(f));
  return (
    <div className="page mentors">
      <h1>Saints for what you’re facing</h1>
      <p className="lede">Find saints, and a few other holy men and women, who lived through something like your situation, and read their own words.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a situation" aria-label="Search a situation" />
      {id && <p className="callout">We couldn’t find that one. Here is the list.</p>}
      {list.length === 0 && <p className="muted">Coming soon.</p>}
      <ul className="list chain-list">
        {shown.map((x) => <li key={x.id}><Link className="t" to={`/study/mentors/${x.id}`}>{x.title}</Link><p className="muted small" style={{ margin: '2px 0 0' }}>“{x.ask}”</p></li>)}
      </ul>
    </div>
  );
}
