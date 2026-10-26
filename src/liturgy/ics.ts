import { addDays, iso, liturgicalDay, type CalendarVariant } from './compute';
import { dutiesOn } from './discipline';

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fold = (l: string) => { const out: string[] = []; let s = l; while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); } out.push(s); return out.join('\r\n'); };
const ymd = (d: Date) => iso(d).replace(/-/g, '');

export interface IcsOptions { from: Date; days: number; variant: CalendarVariant; sundays?: boolean; fasting?: boolean }

/** The Church's year as an iCalendar file: solemnities, feasts, holy days, penitential days and (optionally) Sundays, as all-day events. */
export function churchYearIcs(o: IcsOptions): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Study Bible//Church year//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Church year'];
  for (let i = 0; i < o.days; i++) {
    const d = addDays(o.from, i);
    const ld = liturgicalDay(d, o.variant);
    const duties = dutiesOn(d, o.variant);
    const holy = duties.filter((x) => /holy day|obligation/i.test(x.title));
    const penance = duties.filter((x) => /fast|abstin/i.test(x.title));
    const big = ld.rank === 'solemnity' || ld.rank === 'feast' || ld.rank === 'triduum';
    const sunday = ld.rank === 'sunday' && o.sundays;
    const fast = o.fasting && penance.length > 0 && (ld.season === 'lent' || /ash wednesday|good friday/i.test(ld.dayName));
    if (!big && !sunday && !holy.length && !fast) continue;
    const parts = [ld.dayName, ...holy.map((h) => `Holy day of obligation: ${h.text}`), ...penance.filter(() => fast).map((p) => `${p.title}: ${p.text}`)];
    lines.push(
      'BEGIN:VEVENT',
      `UID:church-${ymd(d)}@studybible`,
      `DTSTAMP:${ymd(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd(d)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(d, 1))}`,
      fold(`SUMMARY:${esc(ld.dayName)}`),
      fold(`DESCRIPTION:${esc(parts.join('\n'))}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
