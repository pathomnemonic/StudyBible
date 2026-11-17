// Chapters whose verse division differs between the Vulgate and modern Bibles, verified in the fourth cycle
// (docs/CYCLE4_LOG.md, section 6). Every expectation here was read in both texts; the test also proves it against the shipped
// texts by checking that each mapped verse exists and that no verse of either side is left without a partner.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { convertRef, fromAnchor, loadVersification, toAnchor } from '../src/lib/versification';
import { refId } from '../src/lib/refs';

const V = JSON.parse(readFileSync('public/data/versification.json', 'utf8'));
const counts = (id: string) => JSON.parse(readFileSync('public/data/editions.json', 'utf8')).editions.find((e: any) => e.id === id).verseCounts as Record<string, number[]>;
beforeAll(() => loadVersification(V));
const to = (s: string, b: string, c: number, v1: number, v2 = v1) => { const r = convertRef(s as any, 'vulgate', { book: b, c1: c, v1, c2: c, v2 }); return `${refId(r.ref)}${r.exact ? '' : ' ~'}`; };

describe.each(['english', 'kjv'])('%s numbering to the Vulgate', (s) => {
  it('John 6: modern 6:51 is 6:51-52, and everything after is one later', () => {
    expect(to(s, 'JHN', 6, 35)).toBe('JHN.6.35');
    expect(to(s, 'JHN', 6, 51, 58)).toBe('JHN.6.51-59'); // the Gospel of Corpus Christi
    expect(to(s, 'JHN', 6, 53)).toBe('JHN.6.54');
    expect(to(s, 'JHN', 6, 68, 69)).toBe('JHN.6.69-70');
    expect(to(s, 'JHN', 6, 51)).toBe('JHN.6.51-52');
  });
  it('Mark 9:1 is the Vulgate\'s 8:39; the Transfiguration (9:2-10) is 9:1-9', () => {
    expect(to(s, 'MRK', 9, 1)).toBe('MRK.8.39');
    expect(to(s, 'MRK', 9, 2, 10)).toBe('MRK.9.1-9');
    expect(to(s, 'MRK', 8, 27, 35)).toBe('MRK.8.27-35');
  });
  it('Matthew 17, Acts 7 and 14, 2 Corinthians 13', () => {
    expect(to(s, 'MAT', 17, 1, 9)).toBe('MAT.17.1-9');
    expect(to(s, 'MAT', 17, 22, 27)).toBe('MAT.17.21-26');
    expect(to(s, 'ACT', 7, 57, 60)).toBe('ACT.7.56-59');
    expect(to(s, 'ACT', 14, 21, 27)).toBe('ACT.14.20-26');
    expect(to(s, '2CO', 13, 11, 14)).toBe('2CO.13.11-13'); // Trinity Sunday
    expect(to(s, '2CO', 13, 14)).toBe('2CO.13.13');
  });
  it('a verse that is only half of a Vulgate verse is said to be inexact, and points at that verse', () => {
    expect(to(s, 'MAT', 17, 15)).toBe('MAT.17.14 ~');
    expect(to(s, 'MRK', 4, 41)).toBe('MRK.4.40 ~');
    expect(to(s, 'ACT', 19, 41)).toBe('ACT.19.40 ~');
    expect(to(s, 'MAT', 17, 14, 15)).toBe('MAT.17.14 ~');
  });
});

describe('the rules close: no verse on either side is left out or invented', () => {
  it.each([['MAT', [17]], ['MRK', [4, 8, 9]], ['JHN', [6]], ['ACT', [7, 14, 19]], ['2CO', [13]], ['REV', [12]],
    ['GEN', [50]], ['LEV', [26]], ['NUM', [11, 12, 13, 20, 29, 30]], ['JOS', [4, 5]], ['JDG', [5, 21]], ['1SA', [20, 23, 24]], ['1KI', [22]], ['1CH', [11, 20]], ['ECC', [4, 5, 6, 7]], ['HOS', [2, 13, 14]], ['JON', [1, 2]]] as [string, number[]][])('%s %j', (book, chapters) => {
    const web = counts('webc'), vul = counts('vulgate'), dra = counts('dra');
    const hit = new Set<string>();
    for (const c of chapters) for (let v = 1; v <= web[book][c - 1]; v++) {
      const a = toAnchor('english', book, c, v);
      expect(a.note ?? '', `${book} ${c}:${v}`).not.toMatch(/Outside|unverified|differs/i);
      for (let x = a.v1; x <= a.v2; x++) { expect(x, `${book} ${c}:${v} -> ${a.c}:${x}`).toBeLessThanOrEqual(vul[book][a.c - 1]); hit.add(`${a.c}:${x}`); }
    }
    for (const c of chapters) {
      expect(vul[book][c - 1]).toBe(dra[book][c - 1]);
      for (let v = 1; v <= vul[book][c - 1]; v++) {
        expect(hit.has(`${c}:${v}`), `Vulgate ${book} ${c}:${v} has a partner`).toBe(true);
        const n = fromAnchor('english', book, c, v);
        expect(n.v2, `Vulgate ${book} ${c}:${v} -> ${n.c}:${n.v2}`).toBeLessThanOrEqual(web[book][n.c - 1]);
      }
    }
  });
});

describe('Old Testament chapters where a verse belongs to the next chapter in the Vulgate', () => {
  it('Jonah 1:17 is 2:1; Ecclesiastes 5:1 is 4:17; Hosea 13:16 is 14:1; Numbers 12:16 is 13:1; 1 Samuel 23:29 is 24:1', () => {
    expect(to('kjv', 'JON', 1, 17)).toBe('JON.2.1');
    expect(to('kjv', 'JON', 2, 1, 10)).toBe('JON.2.2-11');
    expect(to('kjv', 'ECC', 5, 1)).toBe('ECC.4.17');
    expect(to('kjv', 'ECC', 7, 1)).toBe('ECC.7.2');
    expect(to('kjv', 'HOS', 14, 1, 9)).toBe('HOS.14.2-10');
    expect(to('kjv', 'NUM', 12, 16)).toBe('NUM.13.1');
    expect(to('kjv', '1SA', 24, 1, 7)).toBe('1SA.24.2-8');
    expect(to('kjv', 'JDG', 21, 25)).toBe('JDG.21.24 ~');
  });
  it('the NABRE already numbers these as the Vulgate does, so the Lectionary citation is the same place', () => {
    expect(to('nabre', 'JON', 2, 1, 11)).toBe('JON.2.1-11');
    expect(to('nabre', 'ECC', 5, 1, 2)).toBe('ECC.5.1-2');
    expect(to('nabre', 'HOS', 14, 2, 10)).toBe('HOS.14.2-10');
    expect(to('nabre', 'NUM', 13, 1, 2)).toBe('NUM.13.2-3');
  });
});

describe('the NABRE (and so the Lectionary)', () => {
  it('John 6 is verified; the readings of the Bread of Life discourse open at the right verses', () => {
    expect(V.schemes.nabre.unverifiedChapters.JHN ?? []).not.toContain(6);
    expect(to('nabre', 'JHN', 6, 52, 59)).toBe('JHN.6.53-60');
    expect(to('nabre', 'JHN', 6, 60, 69)).toBe('JHN.6.61-70');
    expect(to('nabre', 'MRK', 9, 2, 10)).toBe('MRK.9.1-9');
  });
});

describe('the shipped file is what the generator produces', () => {
  it('outside data still treats the Greek-text books as compare-by-chapter', () => {
    expect(Object.keys(V.schemes.kjv.unalignedBooks).sort()).toEqual(['DAN', 'EST', 'JDT', 'SIR', 'TOB']);
  });
});
