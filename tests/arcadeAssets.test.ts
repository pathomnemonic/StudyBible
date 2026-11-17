import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}/${d.name}`) : [`${dir}/${d.name}`]));
const sources = walk('src').filter((f) => /\.(tsx?|css)$/.test(f));

/** the quoted values of one object literal that maps names to icon names, e.g. const GAME_ART = { '/play/x': 'whale', ... } */
const tableValues = (file: string, table: string): string[] => {
  const t = read(file);
  const at = t.indexOf(table);
  if (at < 0) throw new Error(`${table} not found in ${file}`);
  const body = t.slice(t.indexOf('{', at), t.indexOf('};', at));
  return [...body.matchAll(/:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
};

describe('the games artwork', () => {
  it('every 3D icon the code or the stylesheet names is bundled', () => {
    const names = new Set<string>([
      ...tableValues('src/arcade/art.tsx', 'GAME_ART'),
      ...tableValues('src/pages/play/DeepWatersPage.tsx', 'TIER_ART'),
      ...tableValues('src/pages/play/TrophiesPage.tsx', 'TROPHY_ART'),
    ]);
    for (const f of sources) {
      const t = read(f);
      for (const m of t.matchAll(/<Art n="([a-z0-9-]+)"/g)) names.add(m[1]);
      for (const m of t.matchAll(/\bn=\{[^}]*'([a-z0-9-]+)'[^}]*\}/g)) names.add(m[1]);
      for (const m of t.matchAll(/\bpin\('([a-z0-9-]+)'\)/g)) names.add(m[1]);
      for (const m of t.matchAll(/\/arcade\/3d\/([a-z0-9-]+)\.webp/g)) names.add(m[1]);
    }
    expect(names.size).toBeGreaterThan(30);
    const missing = [...names].filter((n) => !existsSync(`public/arcade/3d/${n}.webp`));
    expect(missing, 'icons named in the code but not in public/arcade/3d').toEqual([]);
  });
  it('every pixel sprite the code or the stylesheets name is bundled', () => {
    const names = new Set<string>();
    for (const f of sources) {
      const t = read(f);
      for (const m of t.matchAll(/arcade\/pixel\/([a-z0-9-]+)\.png/g)) names.add(m[1]);
    }
    const scene = read('src/arcade/DiveScene.tsx');
    for (const m of scene.slice(scene.indexOf('const CREATURES'), scene.indexOf('const base')).matchAll(/'([a-z0-9-]+)'/g)) names.add(m[1]);
    expect(names.size).toBeGreaterThan(8);
    expect([...names].filter((n) => !existsSync(`public/arcade/pixel/${n}.png`))).toEqual([]);
  });
  it('every animated emoji the code names is bundled', () => {
    const codes = new Set<string>();
    for (const f of sources) for (const m of read(f).matchAll(/<Anim c="([0-9a-f]+)"/g)) codes.add(m[1]);
    for (const m of read('src/arcade/ArcadeMode.tsx').matchAll(/\['([0-9a-f]{4,6})',\s*'/g)) codes.add(m[1]);
    expect(codes.size).toBeGreaterThan(4);
    for (const c of codes) expect(existsSync(`public/arcade/anim/${c}.webp`), `anim ${c}`).toBe(true);
  });
  it('the licence text for the 3D icons ships with them, and the animated emoji credit is on record', () => {
    expect(existsSync('public/arcade/LICENSE-fluent-emoji.txt')).toBe(true);
    expect(read('docs/LICENSING.md')).toMatch(/Noto Emoji Animation/);
  });
});
