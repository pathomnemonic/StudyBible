import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { norm } from '../scripts/chains/verify';

const ROOT = new URL('../', import.meta.url).pathname;
const data = JSON.parse(readFileSync(join(ROOT, 'public/data/hymns/hymns.json'), 'utf8')) as { hymns: any[] };
const SEASONS = ['Pentecost', 'Lent and Holy Week', 'Easter', 'Corpus Christi and the Eucharist', 'Marian', 'All Souls and the dead', 'Thanksgiving'];
const source = (f: string) => norm(readFileSync(join(ROOT, 'scripts/hymns/sources', f), 'utf8'));

describe('hymns and chants', () => {
  it('has the hymns asked for, each with a season the page can filter on', () => {
    const ids = data.hymns.map((h) => h.id);
    for (const id of ['veni-creator', 'veni-sancte', 'dies-irae', 'vexilla-regis', 'pange-lingua', 'tantum-ergo', 'o-salutaris', 'adoro-te', 'stabat-mater', 'ave-maris-stella', 'regina-caeli', 'salve-regina', 'te-deum']) expect(ids).toContain(id);
    for (const h of data.hymns) for (const s of h.seasons) expect(SEASONS).toContain(s);
  });
  for (const h of data.hymns) {
    it(`${h.id}: displayed text is word for word in its saved source`, () => {
      expect(h.background.length).toBeGreaterThan(40);
      expect(h.backgroundSource.url).toMatch(/^https:\/\//);
      if (h.latin) { const src = source(h.latin.file); let at = 0; for (const s of h.latin.text) { const i = src.indexOf(norm(s), at); expect(i, `${h.id} Latin: ${s.slice(0, 40)}`).toBeGreaterThanOrEqual(0); at = i; } }
      else expect(h.latinNote).toMatch(/not included/);
      if (h.translation) {
        expect(h.translation.translator.length).toBeGreaterThan(2);
        const src = source(h.translation.file); let at = 0; for (const s of h.translation.text) { const i = src.indexOf(norm(s), at); expect(i, `${h.id} English: ${s.slice(0, 40)}`).toBeGreaterThanOrEqual(0); at = i; }
      } else expect(h.translationNote).toMatch(/not included/i);
    });
  }
});
