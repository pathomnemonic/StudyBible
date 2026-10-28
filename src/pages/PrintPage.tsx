import { Link, useParams } from 'react-router-dom';
import { BOOK_PRAYERS } from '../data/prayerbook';
import { ANGELUS, AVE, CREED, GLORIA, FATIMA, MERCY, MYSTERIES, PATER, REGINA, ROSARY_COLLECT, SALVE, SIGN, SORROWS, STATIONS, type Devotion } from '../data/devotions';
import { CONFESSION, MORE } from '../data/devotions2';
import { PLANS, MORE_PLANS } from '../data/novenas';
import { EXTRA_PLANS } from '../data/novenas2';
import { MORE_PLANS3 } from '../data/novenas3';
import { BRAND } from '../lib/brand';

const DEVOTIONS: Devotion[] = [ANGELUS, REGINA, MERCY, STATIONS, SORROWS, ...MORE, CONFESSION];
const NOVENAS = [...PLANS, ...MORE_PLANS, ...EXTRA_PLANS, ...MORE_PLANS3];

/** Plain, printable sheets: a prayer card, the Rosary guide, a devotion or a whole novena. Print, or save as PDF from the print dialog. */
export default function PrintPage() {
  const { kind, id } = useParams();
  const sheet = (() => {
    if (kind === 'prayer') {
      const p = BOOK_PRAYERS.find((x) => x.id === id);
      return p && { title: p.title, body: <><p className="ps-text ps-big">{p.text}</p>{p.note && <p className="ps-note">{p.note}</p>}</> };
    }
    if (kind === 'rosary') {
      return {
        title: 'How to pray the Rosary',
        body: (
          <>
            <ol className="ps-steps">
              <li>Make the Sign of the Cross and pray the Apostles’ Creed on the crucifix.</li>
              <li>On the first bead, an Our Father. On the next three, a Hail Mary each. Then a Glory Be.</li>
              <li>Announce the first mystery and pray an Our Father. Then ten Hail Marys, one for each bead, thinking of the mystery. End with the Glory Be and the Fatima prayer.</li>
              <li>Repeat for the other four mysteries.</li>
              <li>Finish with the Hail, Holy Queen and the closing prayer.</li>
            </ol>
            <h2>The mysteries</h2>
            <div className="ps-cols">{MYSTERIES.map((m) => <div key={m.id}><h3>{m.name} ({['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].filter((_, i) => m.days.includes(i)).join(', ')})</h3><ol>{m.mysteries.map((x) => <li key={x.title}>{x.title} <span>({x.refs})</span></li>)}</ol></div>)}</div>
            <h2>The prayers</h2>
            {[['Sign of the Cross', SIGN], ['Apostles’ Creed', CREED], ['Our Father', PATER], ['Hail Mary', AVE], ['Glory Be', GLORIA], ['Fatima prayer', FATIMA], ['Hail, Holy Queen', SALVE], ['Closing prayer', ROSARY_COLLECT]].map(([t, x]) => <div key={t} className="ps-prayer"><h3>{t}</h3><p>{x}</p></div>)}
          </>
        ),
      };
    }
    if (kind === 'devotion') {
      const d = DEVOTIONS.find((x) => x.id === id);
      return d && { title: d.name, body: <>{d.blurb && <p className="ps-note">{d.blurb}</p>}{d.steps.map((s, i) => <div key={i} className="ps-prayer"><h3>{s.title}</h3>{s.text && <p>{s.text}</p>}{s.refs && <p className="ps-note">{s.refs}</p>}{s.note && <p className="ps-note">{s.note}</p>}</div>)}</> };
    }
    if (kind === 'novena') {
      const n = NOVENAS.find((x) => x.id === id);
      return n && { title: n.name, body: <>{n.blurb && <p className="ps-note">{n.blurb}</p>}{n.opening && <p>{n.opening}</p>}{n.days.map((d, i) => <div key={i} className="ps-prayer"><h3>{d.title}</h3><p className="ps-note">Read: {d.refs}</p>{d.prayer && <p>{d.prayer}</p>}</div>)}</> };
    }
    return null;
  })();
  if (!sheet) return <div className="page"><p>That sheet could not be found. <Link to="/pray">Back to Pray</Link></p></div>;
  return (
    <div className="page print-page">
      <div className="no-print row" style={{ gap: 8, marginBottom: 10 }}>
        <button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button>
        <button className="btn ghost" onClick={() => history.back()}>Back</button>
      </div>
      <article className="print-sheet">
        <h1>{sheet.title}</h1>
        {sheet.body}
        <p className="ps-foot">{BRAND.name}</p>
      </article>
    </div>
  );
}
