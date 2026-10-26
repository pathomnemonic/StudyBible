import { describe, expect, it } from 'vitest';
import { churchYearIcs } from '../src/liturgy/ics';

describe('church year calendar file', () => {
  const ics = churchYearIcs({ from: new Date(Date.UTC(2026, 0, 1)), days: 365, variant: 'usa', sundays: true, fasting: true });
  it('is a valid iCalendar wrapper with CRLF line ends', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe((ics.match(/END:VEVENT/g) ?? []).length);
  });
  it('includes Easter 2026 (April 5) and Christmas', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20260405');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261225');
  });
  it('keeps every line within 75 octets', () => {
    for (const l of ics.split('\r\n')) expect(l.length).toBeLessThanOrEqual(75);
  });
  it('has unique event ids', () => {
    const ids = ics.match(/UID:[^\r]+/g) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
