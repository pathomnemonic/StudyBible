import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface Psalm { title: string; lines: string[][]; psalm: number }
interface Resp { k?: 'R' | 'V'; t?: string; gloria?: boolean }
interface Chapter { ref: string | null; text: string }
interface Vers { v: string | null; r: string | null }
interface Entry { a: string; p: string }
interface Major { psalms: Entry[]; chapter: Chapter; hymn: string[][]; responsory: Resp[]; versicle: Vers; canticleAnt: string }
interface Little { a: string; psalms: string[]; chapter: Chapter; responsory: Resp[]; versicle: Vers }
interface Office {
  gloria: string; pater: string; ave: string; collect: string;
  days: { lauds: Major; vespers: Major }[];
  minor: Record<'tertia' | 'sexta' | 'nona', { hymn: string[][]; days: Little[] }>;
  compline: {
    hymn: string[][]; reading: Chapter; chapter: Chapter; responsory: Resp[]; versicle: Vers; canticleAnt: string; collect: string;
    days: { a: string; psalms: string[] }[];
  };
  canticles: { benedictus: string[][]; magnificat: string[][]; nunc: string[][] };
  psalms: Record<string, Psalm>;
}

type Hour = 'lauds' | 'tertia' | 'sexta' | 'nona' | 'vespers' | 'compline';
const HOURS: { id: Hour; name: string; when: string }[] = [
  { id: 'lauds', name: 'Lauds', when: 'Morning' },
  { id: 'tertia', name: 'Terce', when: 'Mid-morning' },
  { id: 'sexta', name: 'Sext', when: 'Midday' },
  { id: 'nona', name: 'None', when: 'Afternoon' },
  { id: 'vespers', name: 'Vespers', when: 'Evening' },
  { id: 'compline', name: 'Compline', when: 'Night' },
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function hourNow(): Hour {
  const h = new Date().getHours();
  return h < 8 ? 'lauds' : h < 11 ? 'tertia' : h < 14 ? 'sexta' : h < 17 ? 'nona' : h < 21 ? 'vespers' : 'compline';
}

const ant = (s: string) => s.replace(/\s*\*\s*/g, ' ');

function Verse({ v }: { v: Vers }) {
  return (
    <p className="office-vr">
      <span className="office-k">V.</span> {v.v}<br />
      <span className="office-k">R.</span> {v.r}
    </p>
  );
}

function Responsory({ items, gloria }: { items: Resp[]; gloria: string }) {
  return (
    <div className="office-vr">
      {items.map((x, i) => x.gloria
        ? <p key={i} className="muted small" style={{ margin: '2px 0' }}>{gloria}</p>
        : <p key={i} style={{ margin: '2px 0' }}><span className="office-k">{x.k}.</span> {ant(x.t ?? '')}</p>)}
    </div>
  );
}

function Hymn({ stanzas }: { stanzas: string[][] }) {
  return (
    <div className="office-hymn">
      {stanzas.map((s, i) => <p key={i}>{s.map((l, j) => <span key={j}>{l.replace(/^\*\s*/, '')}<br /></span>)}</p>)}
    </div>
  );
}

function Chapter({ c }: { c: Chapter }) {
  return <p>{c.text}{c.ref && <span className="muted small"> — {c.ref}</span>} <span className="office-k">R. Thanks be to God.</span></p>;
}

function PsalmBlock({ id, data, gloria, canticle }: { id: string; data: Psalm; gloria: string; canticle?: boolean }) {
  return (
    <div className="office-psalm">
      <div className="muted small">{data.title || `Psalm ${data.psalm}`}</div>
      {data.lines.map((l, i) => <p key={i}>{l.map((x, j) => <span key={j}>{x}<br /></span>)}</p>)}
      {!canticle && <p className="muted small">{gloria}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="office-sec"><h3>{title}</h3>{children}</section>;
}

export default function OfficePage() {
  const [data, setData] = useState<Office | null>(null);
  const [err, setErr] = useState('');
  const [hour, setHour] = useState<Hour>(hourNow);
  const [day, setDay] = useState(new Date().getDay());
  useEffect(() => { getJson<Office>('office/office.json').then(setData).catch((e) => setErr(String(e.message ?? e))); }, []);

  const body = useMemo(() => {
    if (!data) return null;
    const g = data.gloria;
    const P = (key: string, canticle?: boolean) => data.psalms[key] && <PsalmBlock key={key} id={key} data={data.psalms[key]} gloria={g} canticle={canticle} />;
    const opening = (
      <Section title="Opening">
        <p><span className="office-k">V.</span> O God, come to my assistance.<br /><span className="office-k">R.</span> O Lord, make haste to help me.</p>
        <p className="muted small">{g} Alleluia (omit in Lent).</p>
      </Section>
    );
    const closing = (collect: string) => (
      <>
        <Section title="Our Father">
          <p>{data.pater}</p>
        </Section>
        <Section title="Collect">
          <p>{collect}</p>
          <p className="muted small">Through our Lord Jesus Christ, thy Son, who liveth and reigneth with thee in the unity of the Holy Ghost, God, world without end. Amen.</p>
        </Section>
        <Section title="Conclusion">
          <p><span className="office-k">V.</span> Let us bless the Lord. <span className="office-k">R.</span> Thanks be to God.<br /><span className="office-k">V.</span> May the souls of the faithful departed, through the mercy of God, rest in peace. <span className="office-k">R.</span> Amen.</p>
        </Section>
      </>
    );
    const antPsalms = (list: { a: string; p: string }[]) => list.map((e, i) => (
      <div key={i} className="office-pair">
        <p className="office-ant"><span className="office-k">Ant.</span> {ant(e.a)}</p>
        {P(e.p)}
      </div>
    ));
    const canticle = (name: 'benedictus' | 'magnificat' | 'nunc', a: string, title: string) => (
      <Section title={title}>
        <p className="office-ant"><span className="office-k">Ant.</span> {ant(a)}</p>
        <div className="office-psalm">
          {data.canticles[name].map((l, i) => <p key={i}>{l.map((x, j) => <span key={j}>{x}<br /></span>)}</p>)}
          <p className="muted small">{g}</p>
        </div>
        <p className="office-ant"><span className="office-k">Ant.</span> {ant(a)}</p>
      </Section>
    );

    if (hour === 'lauds' || hour === 'vespers') {
      const m = data.days[day][hour];
      const l = hour === 'lauds';
      return (
        <>
          {opening}
          <Section title="Psalms">{antPsalms(m.psalms)}</Section>
          <Section title="Chapter"><Chapter c={m.chapter} /></Section>
          <Section title="Responsory"><Responsory items={m.responsory} gloria={g} /></Section>
          <Section title="Hymn"><Hymn stanzas={m.hymn} /></Section>
          <Section title="Versicle"><Verse v={m.versicle} /></Section>
          {canticle(l ? 'benedictus' : 'magnificat', m.canticleAnt, l ? 'Canticle of Zechariah (Benedictus)' : 'Canticle of Mary (Magnificat)')}
          {closing(data.collect)}
        </>
      );
    }
    if (hour === 'compline') {
      const c = data.compline;
      const d = c.days[day];
      return (
        <>
          <Section title="Examination of conscience">
            <p>A moment to look back over the day, give thanks, and ask forgiveness. Then:</p>
            <p><em>I confess to almighty God, to blessed Mary ever virgin, to blessed Michael the archangel, to blessed John the Baptist, to the holy apostles Peter and Paul, and to all the saints, that I have sinned exceedingly in thought, word and deed, through my fault, through my fault, through my most grievous fault. Therefore I beseech blessed Mary ever virgin, blessed Michael the archangel, blessed John the Baptist, the holy apostles Peter and Paul, and all the saints, to pray for me to the Lord our God. Amen.</em></p>
          </Section>
          <Section title="Short reading"><Chapter c={c.reading} /></Section>
          {opening}
          <Section title="Psalms">
            <div className="office-pair">
              <p className="office-ant"><span className="office-k">Ant.</span> {ant(d.a)}</p>
              {d.psalms.map((k) => P(k))}
            </div>
          </Section>
          <Section title="Hymn"><Hymn stanzas={c.hymn} /></Section>
          <Section title="Chapter"><Chapter c={c.chapter} /></Section>
          <Section title="Responsory"><Responsory items={c.responsory} gloria={data.gloria} /></Section>
          <Section title="Versicle"><Verse v={c.versicle} /></Section>
          {canticle('nunc', c.canticleAnt, 'Canticle of Simeon (Nunc dimittis)')}
          <Section title="Collect"><p>{c.collect}</p></Section>
          <Section title="Final blessing">
            <p><span className="office-k">V.</span> May the almighty and merciful Lord bless and keep us. <span className="office-k">R.</span> Amen.</p>
          </Section>
          <Section title="Hail Mary"><p>{data.ave}</p></Section>
        </>
      );
    }
    const h = data.minor[hour];
    const d = h.days[day];
    return (
      <>
        {opening}
        <Section title="Hymn"><Hymn stanzas={h.hymn} /></Section>
        <Section title="Psalms">
          <div className="office-pair">
            <p className="office-ant"><span className="office-k">Ant.</span> {ant(d.a)}</p>
            {d.psalms.map((k) => P(k))}
          </div>
        </Section>
        <Section title="Chapter"><Chapter c={d.chapter} /></Section>
        <Section title="Short responsory"><Responsory items={d.responsory} gloria={g} /></Section>
        <Section title="Versicle"><Verse v={d.versicle} /></Section>
        {closing(data.collect)}
      </>
    );
  }, [data, hour, day]);

  return (
    <div className="page office">
      <h1>The Divine Office</h1>
      <p className="lede">The Church’s prayer through the day, mostly from the Psalms. This is the traditional Roman weekly psalter in the Douay-Rheims psalm text, from the open Divinum Officium project.</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 10 }} role="tablist" aria-label="Hour">
        {HOURS.map((x) => (
          <button key={x.id} role="tab" aria-selected={hour === x.id} className={`btn small${hour === x.id ? ' primary' : ''}`} onClick={() => setHour(x.id)} title={x.when}>{x.name}</button>
        ))}
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 14 }} aria-label="Day of the week">
        {DAYS.map((n, i) => <button key={n} className={`btn small${day === i ? ' primary' : ''}`} onClick={() => setDay(i)}>{n.slice(0, 3)}</button>)}
      </div>
      <p className="muted small">Showing {HOURS.find((x) => x.id === hour)!.name} for {DAYS[day]}, ordinary time.</p>
      {err && <p role="alert" className="card">Could not load the Office ({err}). Check your connection and try again.</p>}
      {!data && !err && <p className="muted">Loading…</p>}
      {body}
      <div className="card small muted" style={{ marginTop: 18 }}>
        <strong>What this is, and isn’t.</strong> This is the traditional (pre-1970) psalter, not the modern Liturgy of the Hours, whose English text is copyrighted. It gives the ordinary weekly cycle: no feast-day, Advent, Lent or Easter propers, and the Sunday and weekday collect and antiphons are representative, not the day’s own. For today’s Mass readings see <Link to="/pray/readings">Readings</Link>. The Office of Readings (Matins) is not included.
      </div>
    </div>
  );
}
