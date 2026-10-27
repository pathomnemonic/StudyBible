import { Link } from 'react-router-dom';
import Fold from '../../components/Fold';
import { useSettings } from '../../lib/store';
import { liturgyFor } from '../../lib/tradition';

/** What the app really has, in plain terms. Rites without a text here are listed once, honestly, and a person from such a Church is given the Roman Mass instead. */
const HAVE: { to: string; title: string; note: string }[] = [
  { to: '/mass', title: 'Roman Mass', note: 'Every part in order, with posture, what you say and today’s readings.' },
  { to: '/mass/ef', title: 'Extraordinary Form (1962)', note: 'The whole Order of Mass in English, with the propers of the day.' },
  { to: '/pray/divine-liturgy', title: 'Byzantine Divine Liturgy', note: 'The Liturgy of St John Chrysostom, a 1914 English rendering.' },
  { to: '/pray/office', title: 'Divine Office', note: 'The traditional Roman psalter, hour by hour.' },
];
const ANCIENT: { to: string; title: string; note: string }[] = [
  { to: '/pray/liturgy/addai-mari', title: 'Addai and Mari', note: 'The ancient East Syriac anaphora, behind the Chaldean and Syro-Malabar rites. For study.' },
  { to: '/pray/liturgy/james', title: 'St James', note: 'The ancient liturgy of Jerusalem and West Syria. For study.' },
  { to: '/pray/liturgy/mark', title: 'St Mark', note: 'The ancient liturgy of Alexandria. For study.' },
];
const NOT_YET = ['Ambrosian and Mozarabic (Latin rites)', 'Ordinariate Divine Worship', 'Syro-Malabar Holy Qurbana', 'Syro-Malankara Holy Qurbana', 'Maronite Holy Qurbono', 'Chaldean Holy Qurbana', 'Armenian Holy Badarak', 'Coptic, Ethiopian and Eritrean Divine Liturgy'];

export default function LiturgiesPage() {
  const [st] = useSettings();
  const lit = liturgyFor(st.tradition);
  const own = lit.own;
  return (
    <div className="page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>Liturgies in the app</h1>

      <section className="feat" aria-label="Your Church">
        <div className="feat-t">{own.name.split(' (')[0]}</div>
        {lit.kind === 'roman' && <p className="feat-d">The Mass follows the Roman Rite, and it is in the app.</p>}
        {lit.kind === 'byzantine' && <p className="feat-d">The Divine Liturgy of St John Chrysostom is in the app.</p>}
        {lit.kind === 'roman-instead' && <p className="feat-d">Your Church’s {own.liturgy} is not in the app yet. We show the Roman Mass in its place, and say so each time.</p>}
        <div className="feat-acts">
          <Link className="btn primary" to={lit.kind === 'byzantine' ? '/pray/divine-liturgy' : '/mass'}>{lit.kind === 'byzantine' ? 'Open the Divine Liturgy' : lit.kind === 'roman' ? 'Open Mass mode' : 'Open the Roman Mass'}</Link>
          {own.site && <a className="btn" href={own.site.url} target="_blank" rel="noreferrer noopener">{own.site.label}</a>}
        </div>
      </section>

      <h2 className="eyebrow-h">What is here</h2>
      <div className="hub-tiles">
        {HAVE.map((h) => <Link key={h.to} to={h.to} className="hub-tile"><span className="hub-tile-t">{h.title}</span><span className="hub-tile-d">{h.note}</span></Link>)}
      </div>

      <h2 className="eyebrow-h" style={{ marginTop: 18 }}>Ancient liturgies, for study</h2>
      <div className="hub-tiles">
        {ANCIENT.map((h) => <Link key={h.to} to={h.to} className="hub-tile"><span className="hub-tile-t">{h.title}</span><span className="hub-tile-d">{h.note}</span></Link>)}
      </div>

      <Fold id="lit:notyet" title="Not in the app yet" hint="Where a rite has no text here, the app does not guess">
        <ul className="list">{NOT_YET.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="muted small">A rite’s own books are the authority for its words. If you can supply a freely reusable English text, or have permission from the Church that owns it, it can be added with the right credit.</p>
      </Fold>
    </div>
  );
}
