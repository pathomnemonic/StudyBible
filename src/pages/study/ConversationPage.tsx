import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { providers, type StudyItem } from '../../study/providers';
import { parseRefId, parseRefs, formatRef, refId } from '../../lib/refs';
import ShareLinkButton from '../../components/ShareLinkButton';

/** Approximate date of writing for the authors the Catena and library quote most. Anything else falls back to its period. */
const YEAR: Record<string, number> = {
  origen: 240, 'origen of alexandria': 240, tertullian: 205, irenaeus: 180, clement: 200, cyprian: 250, hippolytus: 220, eusebius: 325,
  'cyril of jerusalem': 350, athanasius: 350, hilary: 360, 'hilary of poitiers': 360, basil: 370, 'basil the great': 370, 'gregory of nyssa': 380,
  'gregory nazianzen': 380, ambrose: 385, 'ambrose of milan': 385, jerome: 400, 'pseudo-jerome': 450, chrysostom: 395, 'john chrysostom': 395,
  'pseudo-chrysostom (opus imperfectum)': 450, augustine: 410, 'augustine of hippo': 410, 'pseudo-augustine': 450, 'cyril of alexandria': 430, 'titus of bostra': 370,
  'peter chrysologus': 440, 'maximus of turin': 420, epiphanius: 375, 'leo the great': 450, 'gregory the great': 590, 'isidore of seville': 620,
  'john of damascus': 730, 'the venerable bede': 725, bede: 725, alcuin: 800, haymo: 840, 'rabanus maurus': 840, 'remigius of auxerre': 890,
  'glossa ordinaria': 1150, 'glossa interlinearis': 1150, 'gloss (compilers of the catena)': 1260, theophylact: 1090, anselm: 1100, 'bernard of clairvaux': 1130,
  'thomas aquinas': 1270, aquinas: 1270, bonaventure: 1260, 'cornelius a lapide': 1630, lapide: 1630, 'richard challoner': 1750, challoner: 1750, 'george leo haydock (compiler)': 1859,
};
const ERAS = [
  { id: 'early', label: 'The first centuries', sub: 'to 325', to: 325 },
  { id: 'golden', label: 'The age of the councils', sub: '325–451', to: 451 },
  { id: 'dark', label: 'Early Middle Ages', sub: '451–1000', to: 1000 },
  { id: 'schol', label: 'The medieval schools', sub: '1000–1500', to: 1500 },
  { id: 'modern', label: 'Reformation to today', sub: '1500 on', to: 99999 },
];
const PERIOD_YEAR: Record<string, number> = { apostolic: 80, patristic: 400, medieval: 1150, 'early-modern': 1650, modern: 1900, contemporary: 2000 };
const yearOf = (it: StudyItem) => {
  const a = (it.author ?? '').toLowerCase().trim();
  if (YEAR[a]) return YEAR[a];
  const k = Object.keys(YEAR).find((n) => a.includes(n));
  if (k) return YEAR[k];
  const d = it.date && /\d{3,4}/.exec(it.date);
  if (d) return +d[0];
  return PERIOD_YEAR[it.period ?? 'patristic'] ?? 400;
};
const eraOf = (y: number) => ERAS.find((e) => y <= e.to)!;
const clip = (t: string, n = 520) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);
const yearLabel = (y: number) => (y < 1000 ? `c. ${y}` : `${y}`);

/** One verse, read across two thousand years: who said what, when, in time order. It shows the voices; it does not rule between them. */
export default function ConversationPage() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('ref') ?? 'JHN.6.51';
  const [text, setText] = useState(raw.includes('.') ? (() => { const r = parseRefId(raw); return r ? formatRef(r) : raw; })() : raw);
  const [items, setItems] = useState<StudyItem[] | null>(null);
  const [era, setEra] = useState('');
  useEffect(() => {
    const r = raw.includes('.') ? parseRefId(raw) : (() => { const p = parseRefs(raw); return p.ok ? p.refs[0].ref : null; })();
    if (!r) { setItems([]); return; }
    let live = true;
    setItems(null);
    Promise.all([providers.fathers([r]).catch(() => []), providers.commentary([r]).catch(() => [])]).then(([a, b]) => {
      if (!live) return;
      const seen = new Set<string>();
      setItems([...a, ...b].filter((i) => (i.excerpt ?? '').length > 40 && !seen.has(i.id) && (seen.add(i.id), true)));
    });
    return () => { live = false; };
  }, [raw]);
  const timeline = useMemo(() => {
    const dated = (items ?? []).map((it) => ({ it, y: yearOf(it) })).sort((a, b) => a.y - b.y);
    return ERAS.map((e, i) => ({ ...e, list: dated.filter((d) => eraOf(d.y).id === e.id && (i === 0 || d.y > ERAS[i - 1].to)) }));
  }, [items]);
  const go = (e: React.FormEvent) => { e.preventDefault(); const p = parseRefs(text); if (p.ok) setSp({ ref: refId(p.refs[0].ref) }); };
  const total = timeline.reduce((n, e) => n + e.list.length, 0);
  return (
    <div className="page conversation">
      <h1>A verse across the centuries</h1>
      <p className="lede">Read one passage through two thousand years of the Church’s commentators, in time order.</p>
      <form className="rowform" onSubmit={go} role="search">
        <label className="sr-only" htmlFor="cv-ref">Passage</label>
        <input id="cv-ref" value={text} onChange={(e) => setText(e.target.value)} placeholder="John 6:51" />
        <button className="btn primary" type="submit">Show</button>
      </form>
      {items === null && <div className="center-note">Gathering the voices…</div>}
      {items && total === 0 && <p className="muted">No commentary in the library speaks to this passage. Try a nearby verse, or a Gospel verse, where the Catena Aurea is richest.</p>}
      {total > 0 && <>
        <ol className="conv-strip no-print" aria-label="Eras">
          {timeline.map((e) => (
            <li key={e.id}><button className={`conv-era${era === e.id ? ' sel' : ''}${e.list.length ? '' : ' empty'}`} disabled={!e.list.length} aria-pressed={era === e.id} onClick={() => setEra(era === e.id ? '' : e.id)}>
              <span className="conv-n">{e.list.length}</span><span className="conv-l">{e.label}</span><span className="muted small">{e.sub}</span>
            </button></li>
          ))}
        </ol>
        {timeline.filter((e) => e.list.length && (!era || era === e.id)).map((e) => (
          <section key={e.id} className="conv-section" aria-label={e.label}>
            <h2 className="chain-h2">{e.label} <span className="muted small">{e.sub}</span></h2>
            <ol className="chain-steps">
              {e.list.map(({ it, y }) => (
                <li key={it.id} className="chain-step">
                  <div className="chain-rail" aria-hidden="true"><span className="chain-dot" /></div>
                  <div className="chain-body">
                    <p className="chain-meta"><span className="chain-when big">{yearLabel(y)}</span><span className="muted">{it.author}</span></p>
                    <blockquote className="chain-quote"><p>{clip(it.fullExcerpt ?? it.excerpt ?? '')}</p></blockquote>
                    <p className="small muted" style={{ margin: 0 }}>{it.title}</p>
                    <p className="small no-print">{it.internal && <Link to={it.internal}>Read in context</Link>}{it.internal && it.url && ' · '}{it.url && <a href={it.url} target="_blank" rel="noreferrer">Source</a>}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <p className="no-print"><ShareLinkButton path={`/study/conversation?ref=${raw}`} title={`${text} across the centuries`} /></p>
        <p className="muted small">Dates are approximate and tell when the writer lived or wrote. This page lays the voices side by side; it does not judge between them, and an individual commentator’s opinion is not Church teaching. See the <Link to={`/study/fathers-on?ref=${raw}`}>Fathers on this passage</Link>, side by side, or <Link to={`/read/webc/${raw.split('.')[0]}/${raw.split('.')[1]}`}>read the chapter</Link>.</p>
      </>}
    </div>
  );
}
