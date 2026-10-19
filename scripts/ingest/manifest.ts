import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PUBLIC_DATA, writeJson, today } from './lib/util';

/** Lists the study-data files by pack so the app can offer "download for offline use". */
const PACKS: { id: string; label: string; dirs: string[] }[] = [
  { id: 'commentary', label: 'Commentary (Haydock, Catena Aurea, Glossa)', dirs: ['commentary'] },
  { id: 'library', label: 'Fathers & saints library', dirs: ['library'] },
  { id: 'links', label: 'Cross-references, resource links, doctrine, Catechism citations', dirs: ['xrefs', 'resources', 'doctrine'] },
  { id: 'media', label: 'Bible in a Year data', dirs: ['media'] },
];

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.json')) out.push(p);
  }
  return out;
}

export function buildManifest() {
  const packs = PACKS.map((p) => {
    const files = p.dirs.flatMap((d) => walk(join(PUBLIC_DATA, d)));
    return { id: p.id, label: p.label, bytes: files.reduce((n, f) => n + statSync(f).size, 0), files: files.map((f) => relative(PUBLIC_DATA, f).replace(/\\/g, '/')) };
  });
  writeJson(join(PUBLIC_DATA, 'manifest.json'), { generated: today(), packs }, true);
}
