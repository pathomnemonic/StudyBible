import { describe, expect, it } from 'vitest';
import { byzantineFixed, byzantineMovable, julianEaster, traditionOf } from '../src/lib/tradition';

const d = (x: Date) => x.toISOString().slice(0, 10);

describe('Eastern calendar helpers', () => {
  it('computes Orthodox (Julian) Pascha correctly for known years', () => {
    // dates published by the Orthodox Church
    const known: Record<number, string> = { 2020: '2020-04-19', 2021: '2021-05-02', 2022: '2022-04-24', 2023: '2023-04-16', 2024: '2024-05-05', 2025: '2025-04-20', 2026: '2026-04-12', 2027: '2027-05-02', 2028: '2028-04-16', 2029: '2029-04-08' };
    for (const [y, iso] of Object.entries(known)) expect(d(julianEaster(+y)), y).toBe(iso);
  });
  it('lays out the movable days from Pascha', () => {
    const m = byzantineMovable(2026, true);
    const get = (s: string) => d(m.find((x) => x.label.startsWith(s))!.date);
    expect(get('Holy and Great Pascha')).toBe('2026-04-12');
    expect(get('Clean Monday')).toBe('2026-02-23');
    expect(get('Palm Sunday')).toBe('2026-04-05');
    expect(get('Ascension')).toBe('2026-05-21');
    expect(get('Pentecost')).toBe('2026-05-31');
    expect(d(byzantineMovable(2026, false).find((x) => x.label.startsWith('Holy and Great Pascha'))!.date)).toBe('2026-04-05');
  });
  it('moves the fixed feasts 13 days on the old calendar', () => {
    expect(d(byzantineFixed(2026, false).find((x) => x.label === 'Nativity of the Lord')!.date)).toBe('2026-12-25');
    expect(d(byzantineFixed(2026, true).find((x) => x.label === 'Theophany')!.date)).toBe('2026-01-19');
  });
  it('gives the old calendar year the Nativity celebrated in it', () => {
    // Dec 25 of 2025 on the old calendar is Jan 7 of 2026: the 2026 list must hold it, exactly once,
    // and every feast in the list must fall inside 2026 (the year's own Dec 25 belongs to 2027's list)
    const f = byzantineFixed(2026, true);
    expect(f.filter((x) => x.label === 'Nativity of the Lord').map((x) => d(x.date))).toEqual(['2026-01-07']);
    expect(f.every((x) => x.date.getUTCFullYear() === 2026)).toBe(true);
    expect(f).toHaveLength(9);
    expect(byzantineFixed(2026, false).every((x) => x.date.getUTCFullYear() === 2026)).toBe(true);
  });
  it('falls back to the Latin Church for an unknown id', () => {
    expect(traditionOf('nonsense').id).toBe('latin');
    expect(traditionOf('byzantine').liturgy).toBe('Divine Liturgy');
  });
});

import { fromApi, readingRefs } from '../src/liturgy/byzantine';
describe('Byzantine daily readings (Orthocal)', () => {
  it('reads Orthocal references and a day record', () => {
    const r = readingRefs('Galatians 2.16-20');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ book: 'GAL', c1: 2, v1: 16, v2: 20 });
    expect(readingRefs('Luke 16.19-31')[0].book).toBe('LUK');
    const day = fromApi({ titles: ['21st Sunday after Pentecost'], summary_title: '21st Sunday after Pentecost', saints: ['St Tabitha of Joppa'], tone: 4, fast_level_desc: 'No Fast', readings: [{ source: 'Gospel', display: 'Luke 16.19-31' }, { source: 'Epistle', display: 'Galatians 2.16-20' }] });
    expect(day.titles).toEqual(['21st Sunday after Pentecost']);
    expect(day.readings.map((x) => x.source)).toEqual(['Gospel', 'Epistle']);
    expect(day.readings.every((x) => x.refs.length === 1)).toBe(true);
  });
});
