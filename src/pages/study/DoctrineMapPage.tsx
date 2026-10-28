import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDoctrine, type DoctrineTopic } from '../../data/content';

interface Part { id: string; title: string; verb: string; blurb: string; from: number; to: number; sections: [string, number, number][] }
/** The four parts of the Catechism and how they lead into one another. Paragraph ranges are the Catechism's own. */
const PARTS: Part[] = [
  { id: 'creed', title: 'The Profession of Faith', verb: 'Believe', blurb: 'What God has revealed and the Church believes, set out in the Creed.', from: 26, to: 1065,
    sections: [['I believe, we believe', 26, 184], ['God the Father', 199, 421], ['Jesus Christ the Son', 422, 682], ['The Holy Spirit and the Church', 683, 1065]] },
  { id: 'sacraments', title: 'The Celebration of the Christian Mystery', verb: 'Celebrate', blurb: 'How Christ’s life reaches us now, in the liturgy and the seven sacraments.', from: 1066, to: 1690,
    sections: [['The sacramental economy', 1076, 1209], ['The seven sacraments', 1210, 1690]] },
  { id: 'life', title: 'Life in Christ', verb: 'Live', blurb: 'The life that follows from faith and grace: our vocation and the Ten Commandments.', from: 1691, to: 2557,
    sections: [['Our vocation: life in the Spirit', 1699, 2051], ['The Ten Commandments', 2052, 2557]] },
  { id: 'prayer', title: 'Christian Prayer', verb: 'Pray', blurb: 'The meeting of God and the believer, and the Our Father as its summary.', from: 2558, to: 2865,
    sections: [['Prayer in the Christian life', 2558, 2758], ['The Our Father', 2759, 2865]] },
];
const inPart = (t: DoctrineTopic, p: Part) => t.ccc.some(([a]) => a >= p.from && a <= p.to);

/** One picture of the whole Catechism: believe, celebrate, live, pray, each leading to the next, with the doctrine topics that sit in each. */
export default function DoctrineMapPage() {
  const [topics, setTopics] = useState<DoctrineTopic[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { getDoctrine().then((d) => setTopics(d?.topics ?? [])); }, []);
  return (
    <div className="page doctrine-map">
      <h1>The Catechism in one view</h1>
      <p className="muted">Four parts, each leading to the next: what we believe, how we celebrate it, how we live it, and how we pray.</p>
      <ol className="dmap" aria-label="The four parts of the Catechism">
        {PARTS.map((p, i) => {
          const mine = topics.filter((t) => inPart(t, p));
          return (
            <li key={p.id} className={`dmap-part dmap-${p.id}`}>
              <button className="dmap-head" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>
                <span className="dmap-verb">{p.verb}</span>
                <span className="dmap-title">{p.title}</span>
                <span className="dmap-range">§{p.from}–{p.to}</span>
              </button>
              <p className="dmap-blurb">{p.blurb}</p>
              {open === p.id && (
                <div className="dmap-body">
                  <ul className="list small">
                    {p.sections.map(([t, a, b]) => <li key={t}><Link to={`/study/catechism/${a}`}>{t}</Link> <span className="muted">§{a}–{b}</span></li>)}
                  </ul>
                  {mine.length > 0 && <div className="chips" aria-label="Doctrine topics in this part">{mine.map((t) => <Link key={t.id} className="chip" to={`/study/topics/${t.id}`}>{t.title}</Link>)}</div>}
                </div>
              )}
              {i < PARTS.length - 1 && <span className="dmap-arrow" aria-hidden="true">↓</span>}
            </li>
          );
        })}
      </ol>
      <p><Link className="btn" to="/study/compare">Compare the sources on a doctrine</Link></p>
    </div>
  );
}
