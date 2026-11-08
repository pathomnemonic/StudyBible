import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const types = readFileSync('src/chains/types.ts', 'utf8');
const union = /export type StepKind = ([^;]+);/.exec(types)![1];
const KINDS = [...union.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);

describe('step kinds', () => {
  it('includes the writer kind', () => { expect(KINDS).toContain('writer'); });
  it('every kind has a chip colour in the stylesheet', () => {
    const css = readFileSync('src/styles/app.css', 'utf8');
    expect(KINDS.filter((k) => !css.includes(`.chain-kind.k-${k}{`))).toEqual([]);
  });
  it('the chains page has a label for every kind', () => {
    const page = readFileSync('src/pages/study/ChainsPage.tsx', 'utf8');
    const map = /const KIND: Record<[^>]+> = \{([^}]+)\}/.exec(page)![1];
    expect(KINDS.filter((k) => !new RegExp(`\\b${k}:`).test(map))).toEqual([]);
  });
  it('every step in the data files uses a known kind', () => {
    const dir = 'src/data/chains';
    const bad: string[] = [];
    const walk = (o: any, f: string) => {
      if (Array.isArray(o)) o.forEach((x) => walk(x, f));
      else if (o && typeof o === 'object') {
        if (typeof o.kind === 'string' && typeof o.label === 'string' && typeof o.note === 'string' && !KINDS.includes(o.kind)) bad.push(`${f}: ${o.kind}`);
        Object.values(o).forEach((x) => walk(x, f));
      }
    };
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) walk(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')), f);
    expect(bad).toEqual([]);
  });
});
