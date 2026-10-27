import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import FinePrint from '../../components/FinePrint';

interface Block { who: string; t: string }
interface Doc { title: string; source: string; blocks: Block[] }
const LABEL: Record<string, string> = { deacon: 'Deacon', priest: 'Priest', choir: 'Choir', reader: 'Reader', people: 'People', bishop: 'Bishop' };
const ABOUT: Record<string, { family: string; churches: string; blurb: string }> = {
  james: { family: 'West Syriac (Antiochene)', churches: 'the ancestor of the Syro-Malankara and Maronite liturgies, and used on certain days in the Greek Orthodox Church of Jerusalem', blurb: 'The liturgy of Jerusalem, attributed to St James, the “brother of the Lord.” It is one of the oldest complete Eucharistic liturgies, in the form known from the fourth century onward.' },
  mark: { family: 'Alexandrian', churches: 'the ancestor of the Coptic, Ethiopian and Eritrean liturgies', blurb: 'The liturgy of Alexandria, attributed to St Mark the Evangelist. Its Greek form is one of the oldest in Christendom, and its later Coptic forms are those prayed in Egypt and Ethiopia today.' },
  'addai-mari': { family: 'East Syriac (Chaldean)', churches: 'the ancestor of the Chaldean and Syro-Malabar liturgies', blurb: 'The anaphora of the Apostles Addai and Mari, one of the oldest Eucharistic prayers still in use, notable for its ancient wording and for the Church’s 2001 recognition of its validity.' },
};

/** One of the ancient liturgies, to read through. Texts are public-domain translations; the Churches that descend from them pray later, revised and approved texts. */
export default function LiturgyTextPage() {
  const { id = '' } = useParams();
  const about = ABOUT[id];
  const [d, setD] = useState<Doc | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { setD(null); setErr(''); if (about) getJson<Doc>(`liturgy/${id}.json`).then(setD).catch((e) => setErr(String(e.message ?? e))); }, [id]);
  if (!about) return <div className="page"><h1>Liturgy not found</h1><p><Link to="/pray/liturgies">See the Church’s liturgies</Link></p></div>;
  return (
    <div className="page office">
      <h1>{d?.title ?? 'Liturgy'}</h1>
      <p className="lede">{about.blurb} Rite: {about.family}, {about.churches}.</p>
      <div className="notice info" role="note"><strong>For study and prayer at home.</strong> An old English translation, not the text your Church prays today.</div>
      {err && <p role="alert" className="card">Could not load the liturgy ({err}).</p>}
      {!d && !err && <p className="muted">Loading…</p>}
      {d?.blocks.map((b, i) => b.who === 'rubric'
        ? <p key={i} className="muted small" style={{ fontStyle: 'italic' }}>{b.t}</p>
        : b.who === 'text' ? <p key={i}>{b.t}</p>
        : <p key={i}><span className="office-k">{LABEL[b.who] ?? b.who}.</span> {b.t}</p>)}
      {d && <FinePrint title="Source">{d.source}. The translator’s footnotes are left out.</FinePrint>}
    </div>
  );
}
