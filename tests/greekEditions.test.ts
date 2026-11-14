// Greek-edition differences from STEPBible's TAGNT (CC BY 4.0), shipped per book. They must be well-formed, attributed and for real verses,
// and a few famous places must be present (so a broken build of the data cannot pass unnoticed).
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOKS } from '../src/lib/canon';

const dir = 'public/data/lens/greek/';
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const load = (b: string) => JSON.parse(readFileSync(`${dir}${b}.json`, 'utf8')) as { book: string; source: string; url: string; items: { c: number; v: number; kind: string; note: string }[] };

describe('Greek edition notes', () => {
  it('covers the New Testament books that have any', () => { expect(files.length).toBeGreaterThanOrEqual(25); for (const f of files) expect(BOOKS.find((b) => b.id === f.replace('.json', ''))?.testament, f).toBe('NT'); });
  it('every file names its source, licence and link', () => { for (const f of files) { const d = load(f.replace('.json', '')); expect(d.source, f).toMatch(/STEPBible/); expect(d.source, f).toMatch(/CC BY 4\.0/); expect(d.url).toMatch(/^https:\/\/github\.com\/STEPBible\//); } });
  it('every note is for a real chapter of its book, has text, and says what kind of difference it is', () => {
    for (const f of files) {
      const d = load(f.replace('.json', '')); const bk = BOOKS.find((b) => b.id === d.book)!;
      for (const i of d.items) {
        expect(Number.isInteger(i.c) && i.c >= 1 && i.c <= bk.chapters, `${d.book} ${i.c}:${i.v}`).toBe(true);
        expect(Number.isInteger(i.v) && i.v >= 1).toBe(true);
        expect(['only', 'differs']).toContain(i.kind);
        expect(i.note.length, `${d.book} ${i.c}:${i.v}`).toBeGreaterThan(15);
        expect(i.note, `${d.book} ${i.c}:${i.v}`).not.toMatch(/<[a-z]|undefined|\[object/);
      }
    }
  });
  it('notes are in verse order', () => { for (const f of files) { const d = load(f.replace('.json', '')); for (let k = 1; k < d.items.length; k++) { const a = d.items[k - 1], b = d.items[k]; expect(a.c < b.c || (a.c === b.c && a.v <= b.v), `${d.book} order`).toBe(true); } } });
  it('the famous places are there', () => {
    const has = (book: string, c: number, v: number, re: RegExp) => load(book).items.some((i) => i.c === c && i.v === v && re.test(i.note.normalize('NFC')));
    expect(has('MAT', 6, 13, /βασιλεία καὶ ἡ δύναμις/), 'the doxology of the Lord’s Prayer').toBe(true);
    expect(has('LUK', 11, 2, /γενηθήτω/), 'Luke 11:2 “your will be done”').toBe(true);
    expect(has('1JN', 5, 7, /τρεῖς ἕν εἰσιν|ὁ πατήρ/), 'the Johannine Comma').toBe(true);
  });
});
