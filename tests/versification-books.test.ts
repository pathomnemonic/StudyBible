import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BOOKS } from '../src/lib/canon';
import { bookAlignmentNote, fromAnchor, loadVersification, toAnchor } from '../src/lib/versification';
import { chapterLinksFrom, verseLinksFrom, type BookFile } from '../src/lib/verseLinks';

loadVersification(JSON.parse(readFileSync('public/data/versification.json', 'utf8')));
const countsOf = (id: string) => JSON.parse(readFileSync('public/data/editions.json', 'utf8')).editions.find((e: any) => e.id === id).verseCounts as Record<string, number[]>;
const webcCounts = countsOf('webc'); // the English numbering the anchors are built from
const vulgateCounts = countsOf('vulgate'); // the numbering the anchors point into

describe('versification across the whole canon', () => {
  it('the canon has all 73 books', () => expect(BOOKS.length).toBe(73));

  it('every chapter of every book maps into a real chapter of the same book and back without leaving it', () => {
    const bad: string[] = [];
    for (const b of BOOKS) for (let c = 1; c <= b.chapters; c++) for (const v of [1, 2]) {
      const a = toAnchor('english', b.id, c, v);
      // a real chapter at both ends: at least 1, and no more than the book has in that numbering
      if (a.c < 1 || a.c > (vulgateCounts[b.id]?.length ?? 0) || a.v1 < 1 || a.v2 < a.v1) bad.push(`${b.id} ${c}:${v} -> ${a.c}:${a.v1}-${a.v2}`);
      const back = fromAnchor('english', b.id, a.c, a.v1);
      // the way back is bounded by the canon's own chapter count, not the webc text's: Esther's Greek
      // chapters (11 to 16) are real chapters of the book in this app's canon although webc prints 10
      if (back.c < 1 || back.c > b.chapters || back.v1 < 1) bad.push(`${b.id} back ${a.c}:${a.v1}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('every exact mapping returns to the verse it started from', () => {
    const drift: string[] = [];
    // the whole chapter, not only its first 40 verses: Psalm 119 (Vulgate 118) has 176 verses, and
    // the later verses of a long chapter are exactly where an offset would hide
    for (const b of BOOKS) for (let c = 1; c <= b.chapters; c++) for (let v = 1; v <= (webcCounts[b.id]?.[c - 1] ?? 40); v++) {
      const a = toAnchor('english', b.id, c, v);
      if (!a.exact || a.v1 !== a.v2) continue;
      const back = fromAnchor('english', b.id, a.c, a.v1);
      if (back.exact && (back.c !== c || back.v1 !== v)) drift.push(`${b.id} ${c}:${v} -> ${a.c}:${a.v1} -> ${back.c}:${back.v1}`);
    }
    expect(drift.slice(0, 10)).toEqual([]);
  });
});

describe('the Psalms', () => {
  const eng = (c: number, v: number) => toAnchor('english', 'PSA', c, v);
  it('English Psalm n is Vulgate Psalm n-1 from 10 to 113 and 147 is 146', () => {
    expect(eng(23, 1)).toMatchObject({ c: 22, v1: 1, exact: true });
    expect(eng(10, 1)).toMatchObject({ c: 9, v1: 22, exact: true }); // Psalms 9 and 10 are one in the Vulgate
    expect(eng(116, 1)).toMatchObject({ c: 114, v1: 1, exact: true }); // 114 and 115 are one, 116 is split
    expect(eng(119, 1)).toMatchObject({ c: 118, v1: 1, exact: true });
    expect(eng(147, 1)).toMatchObject({ c: 146, v1: 1, exact: true });
  });
  it('a psalm title takes up verses: English Psalm 51:1 is Vulgate 50:3 (the title is verses 1 and 2), and Psalm 3:1 is 3:2', () => {
    expect(eng(51, 1)).toMatchObject({ c: 50, v1: 3, exact: true });
    expect(eng(51, 2)).toMatchObject({ c: 50, v1: 4, exact: true });
    expect(eng(3, 1)).toMatchObject({ c: 3, v1: 2, exact: true });
  });
  it('a verse beyond the verified mapping is never claimed as exact', () => {
    expect(eng(9, 22).exact).toBe(false);
  });
});

describe('books whose numbering does not line up are never presented as exact', () => {
  for (const id of ['TOB', 'JDT', 'EST', 'SIR', 'DAN']) {
    it(`${id} is flagged, and no verse of it maps as exact`, () => {
      const b = BOOKS.find((x) => x.id === id)!;
      expect(bookAlignmentNote('english', id), id).toBeTruthy();
      for (let c = 1; c <= b.chapters; c++) for (const v of [1, 5, 20]) {
        expect(toAnchor('english', id, c, v).exact, `${id} ${c}:${v}`).toBe(false);
        expect(fromAnchor('english', id, c, v).exact, `${id} ${c}:${v}`).toBe(false);
      }
    });
  }
});

describe('a chapter-wide resource is not mistaken for a verse-level one', () => {
  // items: [kind, id, title, route]; rows: [item, from, to, weight]; from = 0 means the whole chapter
  const f: BookFile = { v: 1, book: 'GEN', items: [['father', 'a', 'On verse two', '/x'], ['father', 'b', 'On the whole chapter', '/y']], why: [], notes: [], topics: [], r: { '1': [[0, 2, 2, 5], [1, 0, 0, 5]] } };
  it('a verse lists only what is tied to it, never the chapter-wide item', () => {
    const r = verseLinksFrom(f, 'GEN', 1, 2, 'english');
    expect(r.items.map((i) => i.id)).toEqual(['a']);
    expect(r.items[0].wholeChapter).toBe(false);
  });
  it('a verse nobody wrote about lists nothing, even though the chapter has material', () => {
    expect(verseLinksFrom(f, 'GEN', 1, 3, 'english').items).toEqual([]);
  });
  it('the chapter list includes both and marks the chapter-wide one', () => {
    const r = chapterLinksFrom(f, 'GEN', 1, 'english');
    const by = Object.fromEntries(r.items.map((i) => [i.id, i.wholeChapter]));
    expect(by).toEqual({ a: false, b: true });
  });
});
