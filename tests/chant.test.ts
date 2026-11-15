// The chant scores shipped with the hymns page: each must be a real GABC score whose sung text is the hymn's own Latin text,
// must carry its attribution, and must be readable by the notation library.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs shared with the build scripts
import { align, reviewEntry, sha256, sungWords, words } from '../scripts/chant/compare.mjs';

const chant = JSON.parse(readFileSync('public/data/hymns/chant.json', 'utf8')) as { about: string; items: { hymnId: string; gregobaseId: number; name: string; book: string; transcriber: string; mode: string; officePart: string; gabc: string }[] };
const hymns = (JSON.parse(readFileSync('public/data/hymns/hymns.json', 'utf8')) as { hymns: { id: string; latin: { text: string[] } | null }[] }).hymns;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/v/g, 'u').replace(/j/g, 'i').match(/[a-z]+/g) ?? [];
const sung = (g: string) => norm(g.split('%%').slice(1).join('%%').replace(/<[^>]*>/g, '').replace(/\{([^}]*)\}/g, '$1').replace(/\([^)]*\)/g, '').replace(/~/g, ' '));

describe('chant scores', () => {
  it('there are some, each for a different hymn that exists, with a GregoBase id', () => {
    expect(chant.items.length).toBeGreaterThanOrEqual(8);
    const ids = chant.items.map((i) => i.hymnId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of chant.items) { expect(hymns.some((h) => h.id === i.hymnId), i.hymnId).toBe(true); expect(Number.isInteger(i.gregobaseId)).toBe(true); }
  });
  it('credits the source and licence in the file itself', () => { expect(chant.about).toMatch(/GregoBase/); expect(chant.about).toMatch(/CC0|public domain/i); });
  it('each file has one header and one music section', () => { for (const i of chant.items) expect(i.gabc.split('%%').length, i.hymnId).toBe(2); });
  it('every score is GABC with a clef, notes and text', () => {
    for (const i of chant.items) { expect(i.gabc, i.hymnId).toMatch(/%%/); expect(i.gabc, i.hymnId).toMatch(/\(c?[cf]b?[1-4]\)/); expect(sung(i.gabc).length, i.hymnId).toBeGreaterThan(10); }
  });
  it('the words sung are the hymn\'s own Latin text (so the melody is not under the wrong words)', () => {
    for (const i of chant.items) {
      const h = hymns.find((x) => x.id === i.hymnId)!;
      expect(h.latin, `${i.hymnId} needs Latin text to check against`).toBeTruthy();
      const have = new Set(norm(h.latin!.text.join(' ')));
      const words = sung(i.gabc);
      const hit = words.filter((w) => have.has(w)).length / words.length;
      expect(hit, `${i.hymnId}: ${(hit * 100).toFixed(0)}% of the sung words are in the hymn text`).toBeGreaterThanOrEqual(0.8);
    }
  });
  it('the notation library reads every score', async () => {
    const ex = await import('@vagdur/exsurge');
    const ctxt = new ex.ChantContext();
    for (const i of chant.items) {
      const mappings = ex.Gabc.createMappingsFromSource(ctxt, i.gabc);
      expect(mappings.length, i.hymnId).toBeGreaterThan(5);
    }
  });
});

type Review = { hymnId: string; gregobaseId: number; gabcSha256: string; sourceUrl: string; provenance: { name: string; book: string; transcriber: string; mode: string; officePart: string }; textRepeats: number; minOrdered: number; minCoverage: number; unsungInScore: string[]; explanation: string; reviewedOn?: string; reviewMethod?: string };
const review = JSON.parse(readFileSync('public/data/hymns/chant-review.json', 'utf8')) as { entries: Review[] };
const hymnOf = (id: string) => hymns.find((h) => h.id === id)!;

describe('chant scores: ordered comparison with the hymn text', () => {
  it('every score has exactly one review record, and every record has a score', () => {
    expect(review.entries.map((e) => e.hymnId).sort()).toEqual(chant.items.map((i) => i.hymnId).sort());
  });
  it('a score that changed since it was reviewed fails (the GABC hash must match what a person checked)', () => {
    for (const i of chant.items) {
      const e = review.entries.find((x) => x.hymnId === i.hymnId)!;
      expect(sha256(i.gabc), `${i.hymnId}: the score differs from the reviewed one; re-read the comparison, update chant-review.json (node scripts/chant/review.mjs --write) and its explanation`).toBe(e.gabcSha256);
      expect(e.gregobaseId).toBe(i.gregobaseId);
      expect(e.sourceUrl).toBe(`https://gregobase.selapa.net/chant.php?id=${i.gregobaseId}`);
    }
  });
  it('the source edition and provenance recorded for each score match its header', () => {
    for (const i of chant.items) {
      const e = review.entries.find((x) => x.hymnId === i.hymnId)!;
      expect(e.provenance, i.hymnId).toEqual({ name: i.name, book: i.book, transcriber: i.transcriber, mode: i.mode, officePart: i.officePart });
    }
  });
  it('each record says what was found and how it was reviewed, and none is left UNREVIEWED', () => {
    for (const e of review.entries) {
      expect(e.explanation, e.hymnId).toBeTruthy();
      expect(e.explanation, e.hymnId).not.toMatch(/UNREVIEWED/);
      expect(e.reviewedOn, e.hymnId).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.reviewMethod, e.hymnId).toBeTruthy();
    }
  });
  it('the sung words follow the hymn text in order, and cover as much of it as when reviewed', () => {
    for (const i of chant.items) {
      const e = review.entries.find((x) => x.hymnId === i.hymnId)!;
      const al = align(sungWords(i.gabc), words(hymnOf(i.hymnId).latin!.text.join(' ')), e.textRepeats);
      expect(al.ordered, `${i.hymnId}: sung words in the hymn's order`).toBeGreaterThanOrEqual(Math.max(0.8, e.minOrdered));
      expect(al.coverage, `${i.hymnId}: share of the hymn text that is sung`).toBeGreaterThanOrEqual(e.minCoverage);
      expect(al.unsung, `${i.hymnId}: the portions not sung are the ones that were reviewed`).toEqual(e.unsungInScore);
    }
  });
  it('record regeneration is stable: re-deriving every record from the files reproduces the file', () => {
    for (const i of chant.items) {
      const e = review.entries.find((x) => x.hymnId === i.hymnId)!;
      expect(JSON.parse(JSON.stringify(reviewEntry(i, hymnOf(i.hymnId), e)))).toEqual(e);
    }
  });

  describe('the comparison catches what a bag-of-words check would not', () => {
    const hymn = words('Veni creator spiritus mentes tuorum visita imple superna gratia quae tu creasti pectora');
    it('an intact score is fully ordered and covers the text', () => {
      const al = align(sungWords(`h\n%%\n(c4) ${hymn.join('(f) ')}(f)`), hymn);
      expect(al.ordered).toBe(1); expect(al.coverage).toBe(1); expect(al.unsung).toEqual([]);
    });
    it('the same words in the wrong order pass membership but fail ordering', () => {
      const shuffled = [...hymn].reverse();
      const sung = sungWords(`h\n%%\n(c4) ${shuffled.join('(f) ')}(f)`);
      expect(sung.filter((w: string) => hymn.includes(w)).length / sung.length).toBe(1); // what the old test measured
      expect(align(sung, hymn).ordered).toBeLessThan(0.5);
    });
    it('a truncated score is reported as missing the tail', () => {
      const sung = sungWords(`h\n%%\n(c4) ${hymn.slice(0, 6).join('(f) ')}(f)`);
      const al = align(sung, hymn);
      expect(al.ordered).toBe(1);
      expect(al.coverage).toBeLessThan(0.6);
      expect(al.unsung).toEqual(hymn.slice(6));
    });
    it('a repeated refrain is allowed when the record says the text is sung twice, and not otherwise', () => {
      const twice = sungWords(`h\n%%\n(c4) ${[...hymn, ...hymn].join('(f) ')}(f)`);
      expect(align(twice, hymn).ordered).toBeLessThan(0.6);
      expect(align(twice, hymn, 2).ordered).toBe(1);
    });
    it('a score for a different hymn is rejected', () => {
      const other = sungWords('h\n%%\n(c4) Pange(f) lingua(f) gloriosi(f) corporis(f) mysterium(f) sanguinisque(f) pretiosi(f)');
      expect(align(other, hymn).ordered).toBeLessThan(0.3);
    });
  });
});
