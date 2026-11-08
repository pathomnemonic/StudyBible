import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { norm } from '../scripts/chains/verify';

interface KQ { id: string; theme: string; q: string; little: string; big: string; more: string; avoid: string; ccc: number[]; scripture: { ref: string; label: string; quote: string }[] }
const D = 'public/data';
const data = JSON.parse(readFileSync(`${D}/kids/questions.json`, 'utf8')) as KQ[];
const CCC = new Set<number>();
for (const f of readdirSync(`${D}/ccc`)) if (/^p/.test(f)) for (const p of JSON.parse(readFileSync(`${D}/ccc/${f}`, 'utf8'))) CCC.add(p.n);
function verse(ref: string): string {
  const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return '';
  const ch = JSON.parse(readFileSync(`${D}/bible/webc/${m[1]}.json`, 'utf8')).chapters.find((c: any) => c.n === +m[2]);
  if (!ch) return '';
  const a = +m[3], b = m[4] ? +m[4] : a; let cur = 0; const o: string[] = [];
  for (const blk of ch.blocks) for (const v of Array.isArray(blk[1]) ? blk[1] : []) if (Array.isArray(v) && typeof v[0] === 'number') { if (v[0] > 0) cur = v[0]; if (cur >= a && cur <= b) o.push(v[1]); }
  return o.join(' ');
}
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean);

describe('children’s questions', () => {
  it('has 80 questions with unique ids and every theme used', () => {
    expect(data.length).toBe(80);
    expect(new Set(data.map((d) => d.id)).size).toBe(80);
    expect(new Set(data.map((d) => d.theme)).size).toBe(7);
  });
  it('every question has both answers, a grown-up note and a source', () => {
    for (const k of data) {
      expect(k.little.length, k.id).toBeGreaterThan(30);
      expect(k.big.length, k.id).toBeGreaterThan(30);
      expect(k.more.length, k.id).toBeGreaterThan(20);
      expect(k.avoid.length, k.id).toBeGreaterThan(10);
      expect(k.ccc.length + k.scripture.length, k.id).toBeGreaterThan(0);
      expect(sentences(k.little).length, `${k.id} little`).toBeLessThanOrEqual(4);
      expect(sentences(k.big).length, `${k.id} big`).toBeLessThanOrEqual(5);
    }
  });
  it('every Catechism number exists', () => { expect(data.flatMap((k) => k.ccc.filter((n) => !CCC.has(n)).map((n) => `${k.id}: ${n}`))).toEqual([]); });
  it('every Bible quotation is found verbatim in the WEB Catholic text', () => {
    const bad: string[] = [];
    for (const k of data) for (const s of k.scripture) {
      const hay = norm(verse(s.ref));
      if (!hay) { bad.push(`${k.id}: cannot read ${s.ref}`); continue; }
      for (const seg of s.quote.split(/…|\.\.\./)) if (!hay.includes(norm(seg))) bad.push(`${k.id}: quote not in ${s.ref}`);
    }
    expect(bad).toEqual([]);
  });
  it('avoids the words above and below in user-facing text', () => {
    const txt = JSON.stringify(data).toLowerCase();
    expect(/\b(above|below)\b/.test(txt)).toBe(false);
  });
});
