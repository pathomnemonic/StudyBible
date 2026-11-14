import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = (id: string) => join(__dirname, '..', 'public', 'data', 'bible', id);
const books = (id: string) => readdirSync(dir(id)).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir(id), f), 'utf8')));
const verseText = (id: string, book: string, c: number, v: number) => {
  const b = JSON.parse(readFileSync(join(dir(id), `${book}.json`), 'utf8'));
  const ch = b.chapters.find((x: any) => x.n === c);
  return ch.blocks.filter((bl: any) => typeof bl[1] !== 'string').flatMap((bl: any) => bl[1]).filter((r: any) => r[0] === v).map((r: any) => r[1]).join(' ');
};

// The two licensed editions were read from publisher files. These checks fail on the kinds of damage the first RSV-2CE scan had:
// dropped opening letters, stray symbols inside words, and chapters that run together.
describe.each(['rsv2ce', 'nabre'])('%s', (id) => {
  const all = books(id);
  it('has all 73 books with chapters numbered in order', () => {
    expect(all.length).toBe(73);
    for (const b of all) expect(b.chapters.map((c: any) => c.n), `${id} ${b.id}`).toEqual(b.chapters.map((_: any, i: number) => i + 1));
  });
  it('has no stray symbols or control characters in the text', () => {
    const bad: string[] = [];
    for (const b of all) for (const c of b.chapters) for (const bl of c.blocks) {
      if (typeof bl[1] === 'string') continue;
      for (const [v, t] of bl[1]) {
        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(t) || /[A-Za-z][?™®©¢£§¶°]+[A-Za-z]/.test(t) || /[™®©¢£§¶°]/.test(t)) bad.push(`${b.id} ${c.n}:${v} ${t.slice(0, 50)}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  it('carries footnotes by verse', () => {
    const gen = JSON.parse(readFileSync(join(dir(id), 'GEN.json'), 'utf8'));
    expect(Object.keys(gen.chapters[0].notes ?? {}).length).toBeGreaterThan(2);
  });
});

describe('known verses are intact', () => {
  it('RSV-2CE, where the first scan was damaged', () => {
    expect(verseText('rsv2ce', 'PSA', 119, 18)).toMatch(/^Open my eyes, that I may behold/);
    expect(verseText('rsv2ce', 'PSA', 119, 17)).toMatch(/^Deal bountifully with your servant/);
    expect(verseText('rsv2ce', 'JER', 30, 8)).toMatch(/off their neck, and I will burst their bonds/);
    expect(verseText('rsv2ce', 'GEN', 1, 1)).toBe('In the beginning God created the heavens and the earth.');
    expect(verseText('rsv2ce', 'MAT', 5, 4)).toMatch(/^“Blessed are those who mourn/);
    expect(verseText('rsv2ce', '1TH', 5, 28)).toMatch(/^The grace of our Lord Jesus Christ/);
  });
  it('NABRE', () => {
    expect(verseText('nabre', 'GEN', 1, 1)).toMatch(/^In the beginning, when God created the heavens and the earth/);
    expect(verseText('nabre', 'JHN', 3, 16)).toMatch(/^For God so loved the world that he gave his only Son/);
    expect(verseText('nabre', 'JOB', 10, 1)).toMatch(/I loathe my life/);
  });
});
