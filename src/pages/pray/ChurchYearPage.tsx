import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { liturgicalDay, parseIso, COLOR_NAME, type Season } from '../../liturgy/compute';
import { useSettings } from '../../lib/store';
import Fold from '../../components/Fold';
import FeastsGuide from '../../components/FeastsGuide';
import { byzantineFixed, byzantineMovable, traditionOf } from '../../lib/tradition';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nice = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const KEY: [RegExp, string][] = [
  [/first sunday of advent/i, 'First Sunday of Advent: the year begins'], [/gaudete|third sunday of advent/i, 'Gaudete Sunday'], [/nativity of the lord|christmas day/i, 'Christmas'], [/epiphany/i, 'Epiphany'], [/baptism of the lord/i, 'Baptism of the Lord'],
  [/ash wednesday/i, 'Ash Wednesday'], [/palm sunday|passion sunday/i, 'Palm Sunday'], [/holy thursday|lord.s supper/i, 'Holy Thursday'], [/good friday/i, 'Good Friday'], [/easter sunday|resurrection of the lord/i, 'Easter Sunday'], [/divine mercy/i, 'Divine Mercy Sunday'],
  [/ascension/i, 'Ascension'], [/pentecost sunday|^pentecost/i, 'Pentecost'], [/most holy trinity|trinity sunday/i, 'Trinity Sunday'], [/corpus christi|body and blood/i, 'Corpus Christi'], [/sacred heart/i, 'Sacred Heart'], [/assumption/i, 'Assumption'], [/all saints/i, 'All Saints'], [/king of the universe|christ the king/i, 'Christ the King'], [/immaculate conception/i, 'Immaculate Conception'],
];
const BLURB: Partial<Record<Season, string>> = {
  advent: 'Four weeks of waiting and hope for the coming of Christ. Violet, with rose on Gaudete Sunday.',
  christmas: 'From Christmas to the Baptism of the Lord: the Word made flesh. White.',
  lent: 'Forty days of prayer, fasting and almsgiving before Easter. Violet.',
  triduum: 'Holy Thursday evening to Easter: the Lord’s passion, death and resurrection.',
  easter: 'Fifty days of Easter, from the Resurrection to Pentecost. White.',
  ordinary: 'The Sundays and weeks in which we follow Christ’s life and teaching through the Gospels. Green.',
};

function EasternYear() {
  const [s] = useSettings();
  const t = traditionOf(s.tradition);
  const y = new Date().getFullYear();
  const days = s.tradition === 'byzantine' ? [...byzantineMovable(y, s.paschaJulian), ...byzantineFixed(y, s.oldCalendar)].sort((a, b) => a.date.getTime() - b.date.getTime()) : [];
  return (
    <div className="page">
      <h1>The Church’s year: {t.name.split(' (')[0]}</h1>
      {s.tradition === 'byzantine' ? (
        <>
          <p className="lede">The great days of the Byzantine year for {y}, worked out from the date of Pascha. {s.paschaJulian ? 'Pascha is dated by the Julian reckoning.' : 'Pascha is on the same day as in the Latin Church.'} {s.oldCalendar ? 'Fixed feasts are shown on the old calendar (civil dates 13 days later).' : 'Fixed feasts are shown on the new calendar.'} Change these in <Link to="/settings">Settings → Your Church</Link>.</p>
          <ul className="list">{days.map((d) => <li key={d.label}><strong>{d.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</strong> · {d.label}</li>)}</ul>
          <p className="muted small">Churches differ: some Byzantine Catholic Churches keep Rome’s date of Easter and the new calendar, others the Julian ones. Follow your own eparchy. The daily Apostle and Gospel readings of the Byzantine cycle, and the feasts of saints, are not in this app.</p>
        </>
      ) : (
        <>
          <p className="lede">The {t.name} keeps its own liturgical year, with its own seasons and calendar. This app can’t yet work those dates out for you, and it would be wrong to show you the Roman calendar as if it were yours.</p>
          <p>Please use your Church’s own calendar{t.site ? <>: <a href={t.site.url} target="_blank" rel="noreferrer noopener">{t.site.label}</a></> : ' from your eparchy or parish'}.</p>
          <p><Link to="/pray/year?roman=1">Show the Roman calendar for reference</Link></p>
        </>
      )}
      <p className="small"><Link to="/about#eastern">What the app covers for the Eastern Churches</Link></p>
    </div>
  );
}

export default function ChurchYearPage() {
  const [s] = useSettings();
  const [q] = useSearchParams();
  const roman = q.get('roman') === '1';
  if (s.tradition !== 'latin' && !roman) return <EasternYear />;
  return <RomanYear />;
}

function RomanYear() {
  const [s] = useSettings();
  const nation = s.diocese === 'US' ? 'usa' : 'universal';
  const { segments, key, today } = useMemo(() => {
    const now = new Date();
    // the liturgical year began on the most recent First Sunday of Advent
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 400; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); if (/first sunday of advent/i.test(liturgicalDay(parseIso(iso(d)), nation).dayName)) { start = d; break; } }
    const segs: { season: Season; name: string; from: string; to: string; color: string }[] = [];
    const key: { date: string; label: string }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 366; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const id = iso(d);
      const day = liturgicalDay(parseIso(id), nation);
      if (i > 5 && /first sunday of advent/i.test(day.dayName)) break;
      const last = segs[segs.length - 1];
      if (last && last.season === day.season) last.to = id; else segs.push({ season: day.season, name: day.seasonName, from: id, to: id, color: COLOR_NAME[day.color] });
      for (const [re, label] of KEY) if (re.test(day.dayName) && !seen.has(label)) { seen.add(label); key.push({ date: id, label }); }
    }
    return { segments: segs, key, today: iso(now) };
  }, [nation]);
  return (
    <div className="page">
      <h1>The Church’s year</h1>
      <p className="lede">The cycle of seasons and great days that the readings, prayers and saints follow. Dates are for the {nation === 'usa' ? 'United States' : 'universal'} calendar; change it in Settings.</p>
      <ol className="list year-seasons">
        {segments.map((g) => (
          <li key={g.from} className={g.from <= today && today <= g.to ? 'now' : ''}>
            <strong>{g.name}</strong> <span className="muted small">· {nice(g.from)} to {nice(g.to)} · {g.color}</span>
            {g.from <= today && today <= g.to && <span className="chip sel" style={{ marginLeft: 6 }}>now</span>}
            <div className="muted small">{BLURB[g.season]}</div>
            <Link className="small" to={`/pray/readings/${g.from}`}>The readings on {nice(g.from)} →</Link>
          </li>
        ))}
      </ol>
      <h2>Great days this year</h2>
      <ul className="list">
        {key.sort((a, b) => a.date.localeCompare(b.date)).map((k) => <li key={k.label}><Link to={`/pray/readings/${k.date}`}>{k.label}</Link> <span className="muted small">· {nice(k.date)}</span></li>)}
      </ul>
      <Fold id="year:feasts" title="The great feasts, explained" hint="What each one celebrates, its customs and its readings">
        <FeastsGuide />
      </Fold>
      <p className="muted small">Saints’ days and local feasts are on the <Link to="/pray/readings">readings calendar</Link>. This page follows the Roman calendar only; Eastern Catholic churches keep their own.</p>
    </div>
  );
}
