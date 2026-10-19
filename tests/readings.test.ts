import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../src/lib/canon';
import { loadVersification } from '../src/lib/versification';
import { chapterReadingItems, usccbChapter } from '../src/study/readingLinks';

const D = join(process.cwd(), 'public/data');
const json = (p: string) => JSON.parse(readFileSync(join(D, p), 'utf8'));

beforeAll(() => loadVersification(json('versification.json')));

describe('chapter reading links', () => {
  it('builds three links for every chapter of every book, on known hosts', () => {
    for (const b of BOOKS) {
      for (let c = 1; c <= b.chapters; c++) {
        const items = chapterReadingItems([{ book: b.id, c1: c, c2: c }]);
        expect(items.length, `${b.id} ${c}`).toBe(3);
        for (const i of items) expect(i.url).toMatch(/^https:\/\/(www\.drbo\.org|www\.newadvent\.org|bible\.usccb\.org)\//);
      }
    }
  });
  it('uses the right address patterns', () => {
    const u = (book: string, c: number) => chapterReadingItems([{ book, c1: c, c2: c }]).map((i) => i.url);
    expect(u('GEN', 1)).toContain('https://www.drbo.org/chapter/01001.htm');
    expect(u('GEN', 1)).toContain('https://www.newadvent.org/bible/gen001.htm');
    expect(u('MAT', 5)).toContain('https://www.drbo.org/chapter/47005.htm');
    expect(u('SNG', 2)).toContain('https://www.newadvent.org/bible/son002.htm');
    expect(u('SNG', 2)).toContain('https://bible.usccb.org/bible/songofsongs/2');
  });
  it('maps Joel and Malachi to the USCCB numbering', () => {
    expect(usccbChapter('JOL', 2, 28)).toBe(3);
    expect(usccbChapter('JOL', 3, 1)).toBe(4);
    expect(usccbChapter('MAL', 4, 1)).toBe(3);
  });
});

describe('Challoner data', () => {
  it('has notes, chapter summaries and introductions, including for the deuterocanon', () => {
    const meta = json('commentary/challoner/_meta.json');
    expect(meta.rights).toBe('public-domain');
    expect(meta.notes).toBeGreaterThan(1500);
    expect(meta.chapterSummaries).toBeGreaterThan(1200);
    for (const b of ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA']) {
      const d = json(`commentary/challoner/${b}.json`);
      expect(Object.keys(d.chapters).length, b).toBeGreaterThan(3);
      expect(d.intro.length, b).toBeGreaterThan(50);
    }
    const tob = json('commentary/challoner/TOB.json');
    expect(tob.notes.length).toBeGreaterThan(3);
  });
});

describe('coverage', () => {
  it('records no verse without at least chapter-level material', () => {
    if (!existsSync(join(process.cwd(), 'data/provenance/coverage.json'))) return;
    const c = json('../../data/provenance/coverage.json');
    expect(c.tier.none).toBe(0);
    expect(c.tier.verse / c.total).toBeGreaterThan(0.7);
  });
});
