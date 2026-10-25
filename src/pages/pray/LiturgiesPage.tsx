import { Link } from 'react-router-dom';
import { TRADITIONS } from '../../lib/tradition';

type Have = 'yes' | 'part' | 'no';
interface Rite { name: string; who: string; mass: { what: string; to?: string; have: Have }; hours?: { what: string; to?: string; have: Have }; note?: string }
const MARK: Record<Have, string> = { yes: 'In the app', part: 'Partly in the app', no: 'Not in the app' };

const LATIN: Rite[] = [
  { name: 'Roman Rite: Ordinary Form (the Mass of Paul VI)', who: 'Most Catholics in the world', mass: { what: 'Mass mode: every part in order with posture, what you say, and today’s readings. The Missal’s prayers are copyrighted and are not printed.', to: '/mass', have: 'part' }, hours: { what: 'Liturgy of the Hours: the traditional Roman psalter, not the modern English text (copyright)', to: '/pray/office', have: 'part' } },
  { name: 'Roman Rite: Extraordinary Form (the Mass of 1962)', who: 'Catholics who attend the Latin Mass', mass: { what: 'The whole Order of Mass in English (low Mass) with the Introit, readings, Gradual, Offertory, Secret, Preface, Communion and Postcommunion of the day, from Divinum Officium. Latin text is not included, and the day is chosen by rank without every rule of precedence.', to: '/mass/ef', have: 'part' }, hours: { what: 'Traditional Roman Office, with saints and feasts by date', to: '/pray/office', have: 'part' } },
  { name: 'Ordinariate (Divine Worship)', who: 'Former Anglicans in the Personal Ordinariates', mass: { what: 'The Missal is copyrighted. Mass mode can be used for the order; the Ordinariate’s own books give the prayers.', to: '/mass', have: 'part' }, hours: { what: 'The Ordinariate’s Divine Office is not in the app', have: 'no' } },
  { name: 'Ambrosian and Mozarabic Rites', who: 'Milan; Toledo (and a few places)', mass: { what: 'Not in the app', have: 'no' }, note: 'Both are Latin rites with their own Mass texts. Ask the diocese for the books.' },
];
const EASTERN: Record<string, Rite> = {
  byzantine: { name: 'Byzantine Rite', who: 'Ukrainian, Ruthenian, Melkite, Romanian, Hungarian, Slovak and other Greek Catholic Churches', mass: { what: 'The Divine Liturgy of St John Chrysostom (a 1914 English rendering, public domain). Daily readings and saints from Orthocal.', to: '/pray/divine-liturgy', have: 'part' }, hours: { what: 'The Horologion, Vespers and Matins are not in the app', have: 'no' }, note: 'The Liturgy of St Basil and the Presanctified are not yet in the app.' },
  'syro-malabar': { name: 'Syro-Malabar Church (East Syriac)', who: 'India and the diaspora', mass: { what: 'The Holy Qurbana is not in the app. The Church’s official site has its text.', have: 'no' }, hours: { what: 'Not in the app', have: 'no' } },
  'syro-malankara': { name: 'Syro-Malankara Church (West Syriac)', who: 'India and the diaspora', mass: { what: 'Not in the app', have: 'no' } },
  maronite: { name: 'Maronite Church (West Syriac)', who: 'Lebanon and the diaspora', mass: { what: 'The Holy Qurbono is not in the app. Daily readings in the Maronite calendar are in the Listen tab.', to: '/listen?show=maronite-readings', have: 'part' } },
  chaldean: { name: 'Chaldean Church (East Syriac)', who: 'Iraq and the diaspora', mass: { what: 'Not in the app', have: 'no' } },
  armenian: { name: 'Armenian Catholic Church', who: 'Armenia, Lebanon and the diaspora', mass: { what: 'Not in the app', have: 'no' } },
  alexandrian: { name: 'Coptic, Ethiopian and Eritrean Catholic Churches', who: 'Egypt, Ethiopia, Eritrea and the diaspora', mass: { what: 'Not in the app', have: 'no' } },
};

export default function LiturgiesPage() {
  return (
    <div className="page">
      <Link to="/pray" className="small">← Pray</Link>
      <h1>The Church’s liturgies</h1>
      <p className="lede">The Catholic Church celebrates the Eucharist and the daily hours in many rites. This page says plainly what the app has for each, and where to go for the rest. A rite’s official books are the authority for its words.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
        <Link className="btn primary" to="/mass">Open Mass mode</Link>
        <Link className="btn" to="/pray/divine-liturgy">Divine Liturgy (Byzantine)</Link>
        <Link className="btn" to="/pray/office">Divine Office</Link>
      </div>
      <h2 className="eyebrow-h">The Latin Church</h2>
      {LATIN.map((r) => <RiteCard key={r.name} r={r} />)}
      <h2 className="eyebrow-h">The Eastern Catholic Churches</h2>
      {TRADITIONS.filter((t) => t.id in EASTERN).map((t) => { const r = EASTERN[t.id]; return <RiteCard key={t.id} r={r} site={t.site} />; })}
      <div className="notice info">Where the app does not have a liturgy, it does not guess. If you can supply a freely reusable English text for any of these, or have permission from the Church that owns it, it can be added with the right credit.</div>
    </div>
  );
}

function RiteCard({ r, site }: { r: Rite; site?: { label: string; url: string } }) {
  return (
    <section className="card" style={{ marginBottom: 10 }}>
      <h3 className="card-title">{r.name}</h3>
      <p className="muted small">{r.who}</p>
      <p><strong>{MARK[r.mass.have]}: the Eucharistic liturgy.</strong> {r.mass.what} {r.mass.to && <Link to={r.mass.to}>Open →</Link>}</p>
      {r.hours && <p><strong>{MARK[r.hours.have]}: the daily hours.</strong> {r.hours.what} {r.hours.to && <Link to={r.hours.to}>Open →</Link>}</p>}
      {r.note && <p className="muted small">{r.note}</p>}
      {site && <p className="small"><a href={site.url} target="_blank" rel="noreferrer">{site.label}</a></p>}
    </section>
  );
}
