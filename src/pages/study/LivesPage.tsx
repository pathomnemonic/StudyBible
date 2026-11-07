import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadLives } from '../../chains/load';
import { contextLink } from '../../chains/links';
import type { Life, LifeEvent } from '../../chains/types';
import ShareLinkButton from '../../components/ShareLinkButton';
import PrintButton from '../../components/PrintButton';

const KIND: Record<LifeEvent['kind'], string> = { turning: 'Turning point', setback: 'Setback', work: 'Work', writing: 'Writing', world: 'In the world' };
const yr = (y: number) => (y < 0 ? `${-y} BC` : String(y));

/** A saint's life in time order, with the failures left in, set against what was happening in the world. */
export default function LivesPage() {
  const { id } = useParams();
  const [list, setList] = useState<Life[] | null>(null);
  useEffect(() => { loadLives().then(setList); }, []);
  if (!list) return <div className="page"><p className="center-note">Loading…</p></div>;
  const l = id ? list.find((x) => x.id === id) : undefined;
  if (l) {
    return (
      <div className="page lives">
        <p className="small no-print"><Link to="/study/lives">← Lives in time</Link></p>
        <h1>{l.name} <PrintButton /></h1>
        <p className="muted">{l.lifespan}</p>
        <p className="lede">{l.sketch}</p>
        <ol className="chain-steps life-line" aria-label="Timeline">
          {l.events.map((e, i) => {
            const link = e.step && contextLink(e.step);
            return (
              <li key={i} className={`chain-step life-${e.kind}`}>
                <div className="chain-rail" aria-hidden="true"><span className="chain-dot" /></div>
                <div className="chain-body">
                  <p className="chain-meta"><span className="chain-when big">{yr(e.year)}</span><span className={`life-kind k-${e.kind}`}>{KIND[e.kind]}</span></p>
                  <p className="chain-note">{e.text}</p>
                  {e.step?.quote && <blockquote className="chain-quote"><p>{e.step.quote}</p><footer className="small muted">{e.step.label}</footer></blockquote>}
                  {link && <p className="small no-print"><Link to={link.to}>{link.text}</Link></p>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="no-print">{l.butler && <Link className="btn small" to={`/study/saints/${l.butler.slice(0, 5)}`}>Butler’s full life</Link>} <ShareLinkButton path={`/study/lives/${l.id}`} title={`${l.name}: a life in time`} /></p>
        <p className="muted small">Quotations are checked against the source text built into this app. Dates are those the sources give or are standard dates; “in the world” entries are for context only.</p>
      </div>
    );
  }
  return (
    <div className="page lives">
      <h1>Lives in time</h1>
      <p className="lede">A saint’s life laid out year by year, with the setbacks left in and the world around them in view. Conversion is usually slow.</p>
      {id && <p className="callout">We couldn’t find that one. Here is the list.</p>}
      {list.length === 0 && <p className="muted">Coming soon.</p>}
      <ul className="list chain-list">{list.map((x) => <li key={x.id}><Link className="t" to={`/study/lives/${x.id}`}>{x.name}</Link> <span className="muted small">{x.lifespan}</span><p className="muted small" style={{ margin: '2px 0 0' }}>{x.sketch}</p></li>)}</ul>
    </div>
  );
}
