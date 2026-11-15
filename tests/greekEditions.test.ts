// Greek-edition differences from STEPBible's TAGNT (CC BY 4.0), shipped per book. They must be well-formed, attributed and for real verses,
// and a few famous places must be present (so a broken build of the data cannot pass unnoticed).
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOKS } from '../src/lib/canon';
import { pooledCounts, type CountsEdition } from '../src/lib/refCheck';

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

describe('Greek edition notes: pinned source and numbering', () => {
  const lock = JSON.parse(readFileSync('scripts/stepbible/sources.lock.json', 'utf8')) as { commit: string; repository: string; files: { file: string; sha256: string; bytes: number }[] };
  const meta = (b: string) => JSON.parse(readFileSync(`${dir}${b}.json`, 'utf8')) as { upstream: { commit: string; files: { file: string; sha256: string }[] }; numbering: string; provenance: { note: string; kind: string }; items: { c: number; v: number; note: string }[] };
  const english = pooledCounts((JSON.parse(readFileSync('public/data/editions.json', 'utf8')).editions as CountsEdition[]), 'english')!;

  const outOfRange = (book: string, items: { c: number; v: number }[]) => items.filter((i) => { const n = english.verseCounts[book]?.[i.c - 1]; return !n || i.v < 1 || i.v > n; }).map((i) => `${book} ${i.c}:${i.v}`);
  it('the source is pinned to a full commit, never a branch, and the build script reads it from the lock', () => {
    expect(lock.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(lock.files).toHaveLength(2);
    for (const f of lock.files) expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    const build = readFileSync('scripts/stepbible/build.mjs', 'utf8');
    expect(build).not.toMatch(/STEPBible-Data\/master\//);
    expect(build).toMatch(/sources\.lock\.json/);
    expect(build).toMatch(/does not match the pinned source/);
  });
  it('every shipped file records the same commit and the same file hashes as the lock', () => {
    for (const f of files) {
      const m = meta(f.replace('.json', ''));
      expect(m.upstream.commit, f).toBe(lock.commit);
      expect(m.upstream.files.map((x) => [x.file, x.sha256]), f).toEqual(lock.files.map((x) => [x.file, x.sha256]));
    }
  });
  it('the numbering scheme is stated, and the notes are checked against a verse count of that tradition (not only a chapter count)', () => {
    for (const f of files) {
      const m = meta(f.replace('.json', ''));
      expect(m.numbering, f).toMatch(/NRSV/);
      expect(outOfRange(f.replace('.json', ''), m.items), f).toEqual([]);
    }
  });
  it('the check itself fails on a verse past the end of its chapter', () => {
    const last = english.verseCounts.MAT[5];
    expect(outOfRange('MAT', [{ c: 6, v: last }])).toEqual([]);
    expect(outOfRange('MAT', [{ c: 6, v: last + 1 }])).toHaveLength(1);
    expect(outOfRange('MAT', [{ c: 99, v: 1 }])).toHaveLength(1);
    expect(outOfRange('MAT', [{ c: 6, v: 0 }])).toHaveLength(1);
  });
  it('attribution is kept and source-authored notes are told apart from the app\'s own tagging', () => {
    for (const f of files) {
      const m = meta(f.replace('.json', ''));
      expect(m.provenance.note, f).toMatch(/Source-authored/);
      expect(m.provenance.kind, f).toMatch(/App classification/);
    }
  });
  it('only the Greek New Testament notes (TAGNT) are used: no TIPNR or TAGOT data is shipped', () => {
    const build = readFileSync('scripts/stepbible/build.mjs', 'utf8');
    expect(build).not.toMatch(/TIPNR|TAGOT/);
    expect(readdirSync('public/data/lens').filter((d) => /tipnr|tagot/i.test(d))).toEqual([]);
  });
});
