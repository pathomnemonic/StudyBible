import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadChains } from '../scripts/chains/verify';

type Plain = { summary: string; steps: Record<string, string>; objections: string[] };
const MODES = ['arguments', 'claims', 'development', 'heresies', 'words'] as const;
const plain = (m: string) => JSON.parse(readFileSync(`src/data/chains/plain/${m}.json`, 'utf8')) as Record<string, Plain>;
/** Words too hard for a ten-year-old that should be explained, not used. */
const HARD = /\b(consubstantial|transubstantiation|anathema|anathemas|hypostasis|hypostatic|propitiation|eschatolog\w*|ecumenical|soteriolog\w*|ex opere operato|perichoresis)\b/i;
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
const texts = (p: Plain) => [p.summary, ...Object.values(p.steps), ...p.objections];

describe('plain words', () => {
  for (const m of MODES) {
    describe(m, () => {
      const data = plain(m);
      const chains = loadChains(m);
      it('has the expected number of chains and an entry for every chain id', () => {
        expect(chains.length).toBeGreaterThan(0);
        expect(chains.filter((c) => !data[c.id]).map((c) => c.id)).toEqual([]);
        expect(Object.keys(data).filter((id) => !chains.some((c) => c.id === id))).toEqual([]);
      });
      it('covers every step and every objection, with no quotations of its own', () => {
        for (const c of chains) {
          const p = data[c.id];
          expect(Object.keys(p.steps).sort(), c.id).toEqual(c.steps.map((_, i) => String(i)).sort());
          expect(p.objections.length, c.id).toBe((c.objections ?? []).length);
          expect(Object.keys(p).sort(), c.id).toEqual(['objections', 'steps', 'summary']);
        }
      });
      it('is non-empty, short, and free of hard words and of above/below', () => {
        for (const [id, p] of Object.entries(data)) {
          expect(p.summary.length, id).toBeLessThanOrEqual(520);
          for (const t of texts(p)) {
            expect(t.trim().length, id).toBeGreaterThan(12);
            expect(t.length, `${id}: ${t.slice(0, 40)}`).toBeLessThanOrEqual(560);
            expect(/\b(above|below)\b/i.test(t), `${id}: above/below`).toBe(false);
            expect(HARD.test(t), `${id}: ${t.match(HARD)?.[0]}`).toBe(false);
          }
        }
      });
      it('has an average sentence length under 16 words', () => {
        const bad: string[] = [];
        for (const [id, p] of Object.entries(data)) {
          const s = texts(p).flatMap(sentences);
          const avg = s.reduce((n, x) => n + x.split(/\s+/).length, 0) / s.length;
          if (avg >= 16) bad.push(`${id}: ${avg.toFixed(1)}`);
        }
        expect(bad).toEqual([]);
      });
    });
  }
  it('keeps the data files in the plain folder only for known modes', () => {
    expect(readdirSync('src/data/chains/plain').sort()).toEqual(MODES.map((m) => `${m}.json`).sort());
  });
});
