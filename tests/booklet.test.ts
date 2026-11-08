import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { collectSources, fromChain, fromLife, fromWork, reflectionQuestions } from '../src/lib/booklet';
import type { Chain, Life } from '../src/chains/types';
import type { LibraryWorkMeta } from '../src/data/content';

const lib = JSON.parse(readFileSync('public/data/library/index.json', 'utf8')).works as LibraryWorkMeta[];
const arg = (JSON.parse(readFileSync('src/data/chains/arguments.a.json', 'utf8')) as Chain[])[0];

describe('booklet model', () => {
  it('lists every quoted library work with translator and print source', () => {
    const b = fromChain('argument', arg);
    const rows = collectSources(b, lib);
    const used = new Set(b.sections.flatMap((s) => s.items).map((i) => i.step?.work).filter(Boolean));
    for (const w of used) {
      const meta = lib.find((x) => x.id === w)!;
      const row = rows.find((r) => r.key === `w:${w}`)!;
      expect(row).toBeTruthy();
      if (meta.translator) expect(row.lines.join('\n')).toContain(meta.translator);
      if (meta.printSource) expect(row.lines.join('\n')).toContain(meta.printSource);
    }
    expect(rows.some((r) => r.key === 'scripture')).toBe(true);
  });
  it('questions come from fixed templates and name only the booklet’s own labels', () => {
    const b = fromChain('argument', arg);
    const q = reflectionQuestions(b);
    expect(q.length).toBeGreaterThanOrEqual(5);
    expect(q.some((x) => x.includes(arg.steps.find((s) => s.kind === 'scripture')!.label))).toBe(true);
    expect(q.join(' ')).not.toMatch(/\b(above|below)\b/i);
  });
  it('a life keeps events in order and cites work extracts', () => {
    const life = (JSON.parse(readFileSync('src/data/chains/lives.a.json', 'utf8')) as Life[])[0];
    const b = fromLife(life);
    expect(b.sections[1].items).toHaveLength(life.events.length);
    const w = lib[0];
    const wb = fromWork(w, [{ id: 's', title: 'One', paras: ['alpha beta', 'gamma'] }]);
    expect(collectSources(wb, lib)[0].name).toContain(w.title);
  });
  it('trims a long extract at a paragraph and says so', () => {
    const wb = fromWork(lib[0], [{ id: 's', title: 'One', paras: Array(10).fill('word '.repeat(50).trim()) }], 120);
    expect(wb.trimmed).toBe(true);
    expect(wb.sections[0].items.length).toBe(2);
  });
});
