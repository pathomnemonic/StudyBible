import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

// On a phone a tap leaves :hover switched on until the next tap elsewhere, so tiles and buttons look "randomly selected".
// Hover looks must only apply where a real pointer can hover.
describe('hover styles', () => {
  it('only apply under (hover: hover)', () => {
    const root = postcss.parse(readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8'));
    const bad: string[] = [];
    root.walkRules((r) => {
      if (!/:hover/.test(r.selector)) return;
      for (let a = r.parent; a && a.type !== 'root'; a = a.parent) if (a.type === 'atrule' && /hover:\s*hover/.test((a as postcss.AtRule).params)) return;
      bad.push(r.selector.slice(0, 80));
    });
    expect(bad).toEqual([]);
  });
});
