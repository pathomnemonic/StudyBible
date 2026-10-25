import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ANGELUS, MERCY, MYSTERIES, SORROWS, STATIONS, rosary } from '../src/data/devotions';
import { BOOK_PRAYERS } from '../src/data/prayerbook';
import { parseRefs } from '../src/lib/refs';

describe('devotions', () => {
  it('has twenty mysteries whose references all parse', () => {
    const all = MYSTERIES.flatMap((m) => m.mysteries);
    expect(all).toHaveLength(20);
    for (const m of all) expect(parseRefs(m.refs).ok, m.refs).toBe(true);
  });
  it('covers every weekday with a set of mysteries', () => {
    for (let d = 0; d < 7; d++) expect(MYSTERIES.filter((m) => m.days.includes(d))).toHaveLength(1);
  });
  it('builds a rosary with fifty-three Hail Marys counted', () => {
    const r = rosary(MYSTERIES[0]);
    const ave = r.steps.filter((s) => s.title.includes('Hail Mary') || s.title.includes('Hail Marys')).reduce((n, s) => n + (s.count ?? 1), 0);
    expect(ave).toBe(53);
  });
  it('stations and sorrows have valid scripture', () => {
    expect(STATIONS.steps.filter((s) => s.refs)).toHaveLength(14);
    for (const d of [STATIONS, SORROWS, ANGELUS, MERCY]) for (const s of d.steps) if (s.refs) expect(parseRefs(s.refs).ok, s.refs).toBe(true);
  });
});

describe('prayer book', () => {
  it('has unique ids and no ICEL creed', () => {
    const ids = BOOK_PRAYERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('nicene');
  });
});

describe('office data', () => {
  const o = JSON.parse(readFileSync('public/data/office/office.json', 'utf8'));
  it('has every day with Lauds and Vespers psalms that resolve', () => {
    expect(o.days).toHaveLength(7);
    for (const d of o.days) for (const h of [d.lauds, d.vespers]) {
      expect(h.psalms.length).toBeGreaterThanOrEqual(5);
      for (const e of h.psalms) expect(o.psalms[e.p]?.lines.length, e.p).toBeGreaterThan(0);
      expect(h.hymn.length).toBeGreaterThan(0);
      expect(h.chapter.text).toBeTruthy();
    }
  });
  it('has little hours and compline for every day', () => {
    for (const h of ['tertia', 'sexta', 'nona']) {
      expect(o.minor[h].days).toHaveLength(7);
      for (const d of o.minor[h].days) for (const k of d.psalms) expect(o.psalms[k]?.lines.length, k).toBeGreaterThan(0);
    }
    expect(o.compline.days).toHaveLength(7);
    for (const d of o.compline.days) for (const k of d.psalms) expect(o.psalms[k]?.lines.length, k).toBeGreaterThan(0);
  });
});
