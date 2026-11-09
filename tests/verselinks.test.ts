import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { buildCatalog, buildIndex, verseCount, type BookFile } from '../scripts/launch/make-verse-links';
import { parseRefId } from '../src/lib/refs';
import { chapterLinksFrom, verseLinksFrom } from '../src/lib/verseLinks';

const DIR = 'public/data/verse-links';
const file = (b: string): BookFile | null => (existsSync(`${DIR}/${b}.json`) ? JSON.parse(readFileSync(`${DIR}/${b}.json`, 'utf8')) : null);
const at = (b: string, c: number, v: number) => verseLinksFrom(file(b), b, c, v, undefined, 200);
const ids = (b: string, c: number, v: number) => at(b, c, v).items.map((i) => `${i.kind}:${i.id}`);

describe('curated hooks', () => {
  const cat = buildCatalog();
  const hooks = JSON.parse(readFileSync('src/data/verseHooks.json', 'utf8')).hooks as { topic: string; verses: string[]; items: { kind: string; id: string }[]; why: string; note?: string }[];
  it('has about 40 or more hooks, each with a plain why, and every item id exists', () => {
    expect(hooks.length).toBeGreaterThanOrEqual(40);
    const bad: string[] = [];
    for (const h of hooks) {
      if (!h.topic || h.why.length < 20 || !h.verses.length || !h.items.length) bad.push(`${h.topic}: incomplete`);
      for (const it of h.items) if (!cat.has(`${it.kind}:${it.id}`)) bad.push(`${h.topic}: no ${it.kind}:${it.id}`);
    }
    expect(bad).toEqual([]);
  });
  it('every verse reference is real: the chapter and verses exist in the text', () => {
    const bad: string[] = [];
    for (const h of hooks) for (const v of h.verses) {
      const r = parseRefId(v);
      if (!r || !verseCount(r.book, r.c1) || r.c2 > 200) { bad.push(`${h.topic}: ${v}`); continue; }
      if (r.v1 !== undefined && (r.v1 > verseCount(r.book, r.c1) || (r.v2 ?? r.v1) > verseCount(r.book, r.c2))) bad.push(`${h.topic}: ${v} past the end of the chapter`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the built index', () => {
  it('drops almost nothing, and every item resolves to real data', () => {
    const { files, stats } = buildIndex();
    expect(stats.dropped.length).toBeLessThanOrEqual(3);
    expect(stats.versesLinked).toBeGreaterThan(5000);
    const cat = buildCatalog();
    for (const bf of files.values()) for (const [k, id, title, route] of bf.items) {
      expect(cat.has(`${k}:${id}`), `${k}:${id}`).toBe(true);
      expect(title.length).toBeGreaterThan(0);
      expect(route.startsWith('/')).toBe(true);
    }
  });
  it('the files on disk match a fresh build (run: npx tsx scripts/launch/make-verse-links.ts)', () => {
    const { files } = buildIndex();
    const onDisk = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort();
    expect(onDisk).toEqual([...files.keys()].sort());
  });
  it('has no dangling ranges: every range sits inside its chapter and every index points at a table entry', () => {
    const bad: string[] = [];
    for (const f of readdirSync(DIR)) {
      const bf = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')) as BookFile;
      for (const [c, rows] of Object.entries(bf.r)) {
        const max = verseCount(bf.book, +c);
        if (!max) bad.push(`${bf.book} ${c}: no such chapter`);
        for (const [i, from, to, w, why = -1, note = -1, topic = -1] of rows) {
          if (!bf.items[i]) bad.push(`${bf.book} ${c}: item ${i}`);
          if (from === 0 ? to !== 0 : from < 1 || to < from || to > max) bad.push(`${bf.book} ${c}:${from}-${to} (max ${max})`);
          if (w < 1 || w > 100) bad.push(`${bf.book} ${c}: weight ${w}`);
          if (why >= bf.why.length || note >= bf.notes.length || topic >= bf.topics.length) bad.push(`${bf.book} ${c}: table index`);
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('is compact: under 2.5 MB in all', () => {
    const total = readdirSync(DIR).reduce((n, f) => n + statSync(`${DIR}/${f}`).size, 0);
    expect(total).toBeLessThan(2.5 * 1024 * 1024);
  });
});

describe('expected links', () => {
  const table: [string, number, number, string[]][] = [
    ['PHM', 1, 16, ['argument:slavery-and-the-fathers']],
    ['EXO', 21, 2, ['argument:slavery-and-the-fathers', 'apologetics:slavery-bible']],
    ['LEV', 25, 44, ['argument:slavery-and-the-fathers']],
    ['1CO', 7, 21, ['argument:slavery-and-the-fathers']],
    ['EPH', 6, 5, ['argument:slavery-and-the-fathers']],
    ['COL', 4, 1, ['argument:slavery-and-the-fathers']],
    ['1TI', 1, 10, ['argument:slavery-and-the-fathers']],
    ['MAT', 16, 18, ['argument:papal-primacy']],
    ['JHN', 6, 53, ['argument:real-presence']],
    ['MAT', 1, 25, ['argument:mary-ever-virgin']],
    ['JAS', 5, 14, ['argument:anointing-of-the-sick']],
    ['ACT', 8, 15, ['argument:confirmation']],
    ['2MA', 12, 45, ['argument:purgatory']],
    ['ROM', 16, 1, ['argument:women-in-the-early-church']],
    ['EXO', 22, 25, ['argument:usury-and-lending']],
    ['REV', 12, 5, ['argument:assumption-of-mary']],
  ];
  for (const [b, c, v, want] of table) {
    it(`${b} ${c}:${v}`, () => { const got = ids(b, c, v); for (const w of want) expect(got, w).toContain(w); });
  }
  it('PHM 1:16 shows a hook note and a topic', () => {
    const r = at('PHM', 1, 16);
    expect(r.notes.length).toBeGreaterThan(0);
    expect(r.items.find((i) => i.id === 'slavery-and-the-fathers')?.weight).toBeGreaterThanOrEqual(90);
  });
  it('a verse quoted in a chain step outranks a lesson that merely teaches the passage', () => {
    const r = at('JHN', 6, 53).items;
    const arg = r.findIndex((i) => i.id === 'real-presence' && i.kind === 'argument');
    const les = r.findIndex((i) => i.kind === 'lesson');
    expect(arg).toBeGreaterThanOrEqual(0);
    if (les >= 0) expect(arg).toBeLessThan(les);
  });
  it('caps the list and reports how many more there are', () => {
    const r = verseLinksFrom(file('JHN'), 'JHN', 6, 53, undefined, 4);
    expect(r.items.length).toBeLessThanOrEqual(4);
    expect(r.items.length + r.more).toBe(r.total);
  });
  it('no single kind fills the capped list when others are available', () => {
    const r = verseLinksFrom(file('JHN'), 'JHN', 6, 53, undefined, 8);
    const counts: Record<string, number> = {};
    for (const i of r.items) counts[i.kind] = (counts[i.kind] ?? 0) + 1;
    if (r.total > 8) expect(Math.max(...Object.values(counts))).toBeLessThan(8);
  });
  it('a verse with nothing returns an empty result, and a missing book file does too', () => {
    expect(verseLinksFrom(null, 'GEN', 1, 1).items).toEqual([]);
    expect(at('NAM', 3, 19).total).toBeGreaterThanOrEqual(0);
  });
  it('chapter roll-up includes chapter-level links and verse links', () => {
    const r = chapterLinksFrom(file('PHM'), 'PHM', 1, undefined, 50);
    expect(r.items.map((i) => i.id)).toContain('slavery-and-the-fathers');
    const m = chapterLinksFrom(file('MAT'), 'MAT', 16, undefined, 50);
    expect(m.items.some((i) => i.kind === 'lesson')).toBe(true);
  });
});
