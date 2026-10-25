import { useEffect, useState } from 'react';
import ReadingBlock from './ReadingBlock';
import { byzantineDay, type ByzDay } from '../liturgy/byzantine';
import { useSettings } from '../lib/store';
import { easter } from '../liturgy/compute';
import { julianEaster } from '../lib/tradition';

/** The day in the Byzantine calendar: its title, saints, fast and the Epistle and Gospel, shown in your translation. */
export default function ByzantineDay({ date }: { date: string }) {
  const [s] = useSettings();
  const [day, setDay] = useState<ByzDay | null | undefined>(undefined);
  useEffect(() => { setDay(undefined); byzantineDay(date, s.oldCalendar).then(setDay); }, [date, s.oldCalendar]);
  const y = +date.slice(0, 4);
  const differ = easter(y).toISOString().slice(0, 10) !== julianEaster(y).toISOString().slice(0, 10);
  const main = day?.readings.filter((r) => /^(Epistle|Gospel)$/.test(r.source)) ?? [];
  const other = day?.readings.filter((r) => !/^(Epistle|Gospel)$/.test(r.source)) ?? [];
  return (
    <div className="card">
      <h2>The Byzantine day</h2>
      {day === undefined && <div className="muted">Loading…</div>}
      {day === null && <div className="notice">The Byzantine readings could not be loaded. They come from the Orthocal service, so this needs a connection the first time you open a day.</div>}
      {day && (
        <>
          <div className="row between"><strong>{day.titles[0]}</strong>{day.tone ? <span className="chip">Tone {day.tone}</span> : null}</div>
          {day.titles.slice(1).map((t) => <div key={t} className="muted small">{t}</div>)}
          {day.fast && day.fast !== 'No Fast' && <p className="small"><strong>{day.fast}.</strong> {day.fastNote}</p>}
          {day.saints.length > 0 && <><div className="eyebrow">Saints and feasts</div><ul className="list small">{[...day.feasts, ...day.saints].map((x) => <li key={x}>{x}</li>)}</ul></>}
          <div className="reading-stack">
            {main.map((r) => <ReadingBlock key={r.source} refs={r.refs} label={r.source} text={r.display} />)}
          </div>
          {other.length > 0 && <details><summary className="small">Other readings of the day ({other.length})</summary><ul className="list small">{other.map((r, i) => <li key={i}>{r.source}: {r.display}</li>)}</ul></details>}
          <p className="muted small">From <a href="https://orthocal.info" target="_blank" rel="noreferrer noopener">orthocal.info</a>, which follows the Julian reckoning of Pascha. {!s.paschaJulian && differ ? 'Your Church keeps Rome’s date of Pascha, which differs this year, so movable readings may not match your parish. ' : ''}{s.oldCalendar ? 'Showing the old (Julian) calendar.' : 'Showing the new (revised Julian) calendar.'} The references are the Byzantine cycle; the text is in your chosen translation, not the one your parish reads aloud.</p>
        </>
      )}
    </div>
  );
}
