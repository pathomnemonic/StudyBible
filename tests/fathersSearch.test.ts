import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { FathersEngine, compareAuthors, centuryBand, startYear, highlight, queryWords, EXAMPLE_QUESTIONS, type LoadWork } from '../src/lib/fathersSearch';

const dir = 'public/data/library';
const read = (p: string) => JSON.parse(readFileSync(`${dir}/${p}`, 'utf8'));
let eng: FathersEngine;
const cache = new Map<string, unknown>();
const load: LoadWork = async (id) => { if (!cache.has(id)) cache.set(id, read(`works/${id}.json`)); return cache.get(id) as never; };

beforeAll(() => { eng = new FathersEngine(read('fulltext-index.json'), read('index.json')); }, 60000);

describe('fathersSearch', () => {
  it('dates and bands', () => {
    expect(startYear('c. 407–420')).toBe(407);
    expect(centuryBand(150)).toBe('1st–2nd');
    expect(centuryBand(226)).toBe('3rd');
    expect(centuryBand(1076)).toBe('6th–15th');
    expect(centuryBand(1845)).toBe('Later');
    expect(queryWords('Why do we baptize infants?')).toEqual(['baptize', 'infants']);
  });
  it('infant baptism finds Augustine, Cyprian or Origen near the top', async () => {
    const r = await eng.search('Why do we baptize infants?', load);
    const top = r.hits.slice(0, 6).map((h) => h.authorId);
    expect(top.some((a) => ['augustine', 'cyprian', 'origen'].includes(a))).toBe(true);
    expect(r.hits[0].passages[0].text.length).toBeGreaterThan(40);
    expect(r.hits[0].passages[0].text).toMatch(/infant|child/i);
  }, 60000);
  it('Sunday worship returns Justin', async () => {
    const r = await eng.search('Sunday worship', load);
    expect(r.hits.map((h) => h.authorId)).toContain('justin');
  }, 60000);
  it('nonsense returns nothing', async () => {
    expect((await eng.search('xqzvw blorptangle', load)).hits).toEqual([]);
    expect((await eng.search('why do we', load)).hits).toEqual([]);
  });
  it('filters by author and century', async () => {
    const r = await eng.search('baptism', load, { authorIds: ['cyprian'] });
    expect(r.hits.length).toBeGreaterThan(0);
    expect(r.hits.every((h) => h.authorId === 'cyprian')).toBe(true);
    const e = await eng.search('baptism', load, { bands: ['1st–2nd'] });
    expect(e.hits.every((h) => h.band === '1st–2nd')).toBe(true);
  }, 60000);
  it('every example question finds something', async () => {
    for (const q of EXAMPLE_QUESTIONS) expect((await eng.search(q, load, {}, 5)).hits.length, q).toBeGreaterThan(0);
  }, 120000);
  it('highlights query words', () => {
    const s = highlight('Infants are baptized for forgiveness', ['baptize', 'infants']);
    expect(s.filter((x) => x.hit).map((x) => x.t)).toEqual(['Infants', 'baptized']);
  });
  it('compares two authors with counts only', async () => {
    const c = await compareAuthors(eng, 'baptism', 'augustine', 'tertullian', load);
    expect(c.a.length && c.b.length).toBeTruthy();
    expect(c.yearGap).toBeGreaterThanOrEqual(0);
    expect(c.sharedTerms).toContain('bapt');
  }, 60000);
});
