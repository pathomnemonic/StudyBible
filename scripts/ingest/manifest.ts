import { readdirSync, statSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { PUBLIC_DATA, writeJson, today } from './lib/util';

/** Lists the study-data files by pack so the app can offer "download for offline use". */
const PACKS: { id: string; label: string; dirs: string[] }[] = [
  { id: 'commentary', label: 'Commentary (Haydock, Challoner, Catena Aurea, Glossa)', dirs: ['commentary'] },
  { id: 'library', label: 'Fathers & saints library', dirs: ['library'] },
  { id: 'links', label: 'Cross-references, resource links, doctrine, Catechism citations', dirs: ['xrefs', 'resources', 'doctrine'] },
  { id: 'media', label: 'Bible in a Year data', dirs: ['media'] },
  { id: 'reference', label: 'Book outlines, indexes, synopsis, genealogies, memory sets', dirs: ['reference'] },
  { id: 'places', label: 'Maps data and topical index', dirs: ['maps', 'topics'] },
  { id: 'original', label: 'Greek and Hebrew word study', dirs: ['original'] },
  { id: 'church', label: 'Church documents on Scripture (article numbers and references)', dirs: ['magisterium'] },
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
    return {
      id: p.id,
      label: p.label,
      bytes: files.reduce((n, f) => n + statSync(f).size, 0),
      files: files.map((f) => relative(PUBLIC_DATA, f).replace(/\\/g, '/')),
      // per-file size and a short SHA-256, so the app can show real progress and notice a truncated or altered download
      sizes: files.map((f) => statSync(f).size),
      sums: files.map((f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16)),
    };
  });
  // whole Bible editions: each book's size and checksum, so a download can be verified like a study pack
  const editions: Record<string, { sizes: Record<string, number>; sums: Record<string, string> }> = {};
  for (const e of readdirSync(join(PUBLIC_DATA, 'bible'))) {
    const dir = join(PUBLIC_DATA, 'bible', e);
    if (!statSync(dir).isDirectory()) continue;
    const e2: { sizes: Record<string, number>; sums: Record<string, string> } = { sizes: {}, sums: {} };
    editions[e] = e2;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      e2.sizes[f.replace(/\.json$/, '')] = statSync(join(dir, f)).size;
      e2.sums[f.replace(/\.json$/, '')] = createHash('sha256').update(readFileSync(join(dir, f))).digest('hex').slice(0, 16);
    }
  }
  writeJson(join(PUBLIC_DATA, 'manifest.json'), { generated: today(), packs, editions }, true);
}
