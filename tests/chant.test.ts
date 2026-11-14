// The chant scores shipped with the hymns page: each must be a real GABC score whose sung text is the hymn's own Latin text,
// must carry its attribution, and must be readable by the notation library.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chant = JSON.parse(readFileSync('public/data/hymns/chant.json', 'utf8')) as { about: string; items: { hymnId: string; gregobaseId: number; name: string; book: string; transcriber: string; gabc: string }[] };
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
