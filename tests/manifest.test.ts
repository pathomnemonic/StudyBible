import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'public/data';
const walk = (d: string, out: string[] = []) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const man = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8')) as { packs: { id: string; bytes: number; files: string[]; sizes: number[] }[]; editions: Record<string, { sizes: Record<string, number> }> };

describe('download manifest', () => {
  it('lists every data file in some pack, so "download everything" really is everything', () => {
    const inPack = new Set(man.packs.flatMap((p) => p.files));
    const missing = walk(ROOT).map((f) => relative(ROOT, f).replace(/\\/g, '/')).filter((f) => f.endsWith('.json') && !f.startsWith('bible/') && f !== 'manifest.json' && !inPack.has(f));
    expect(missing, `not in any pack (run: npx tsx -e "import {buildManifest} from './scripts/ingest/manifest'; buildManifest()"): ${missing.slice(0, 8).join(', ')}`).toEqual([]);
  });
  it('states the real size of each pack, not an old one', () => {
    for (const p of man.packs) {
      const real = p.files.reduce((n, f) => n + statSync(join(ROOT, f)).size, 0);
      expect(p.bytes, `${p.id} size`).toBe(real);
      expect(p.sizes.length).toBe(p.files.length);
    }
  });
  it('has every Bible book size right', () => {
    for (const [e, v] of Object.entries(man.editions)) for (const [b, n] of Object.entries(v.sizes)) expect(statSync(join(ROOT, 'bible', e, `${b}.json`)).size, `${e}/${b}`).toBe(n);
  });
});
