import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; });

describe('text in the data files', () => {
  it('has no HTML entities left in it (they would show as raw &amp; or &atilde; on screen)', () => {
    const bad: string[] = [];
    for (const f of [...walk('public/data'), ...walk('src/data')]) {
      if (f.endsWith('manifest.json')) continue;
      const m = /&(?:[A-Za-z]{2,8}|#\d+|#x[0-9a-f]+);/.exec(readFileSync(f, 'utf8'));
      if (m && m[0].toLowerCase() !== '&lt;') bad.push(`${f}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  }, 60000);
});
