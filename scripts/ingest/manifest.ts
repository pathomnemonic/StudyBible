import { readdirSync, statSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { PUBLIC_DATA, writeJson, today } from './lib/util';

/** Lists the study-data files by pack so the app can offer "download for offline use". */
const PACKS: { id: string; label: string; dirs: string[] }[] = [
  { id: 'learn', label: 'Catechism text, the K–12 lessons, children’s stories and apologetics', dirs: ['ccc', 'curriculum', 'kids', 'paths', 'apologetics.json', 'kids_stories.json'] },
  { id: 'people', label: 'Saints, the Catholic encyclopedia, dictionary and papal writings', dirs: ['saints', 'encyclopedia', 'dictionary', 'papal', 'terms'] },
  { id: 'prayer', label: 'Divine Office, Latin Mass texts, lectionary and daily data', dirs: ['office', 'missa', 'liturgy', 'lectionary', 'daily', 'usccb', 'jesus', 'lens', 'registry', 'church'] },
  { id: 'commentary', label: 'Commentary (Haydock, Challoner, Catena Aurea, Glossa)', dirs: ['commentary'] },
  { id: 'library', label: 'Fathers & saints library', dirs: ['library'] },
  { id: 'links', label: 'Cross-references, resource links, doctrine, Catechism citations', dirs: ['xrefs', 'resources', 'doctrine'] },
  { id: 'media', label: 'Media lists: Bible in a Year schedule, podcasts, audiobooks and videos (the audio and video themselves are not included)', dirs: ['media'] },
  { id: 'reference', label: 'Book outlines, indexes, synopsis, genealogies, memory sets', dirs: ['reference'] },
  { id: 'places', label: 'Maps data and topical index', dirs: ['maps', 'topics'] },
  { id: 'original', label: 'Greek and Hebrew word study', dirs: ['original'] },
  { id: 'church', label: 'Church documents on Scripture (article numbers and references)', dirs: ['magisterium'] },
];

function walk(dir: string, out: string[] = []) {
  if (statSync(dir).isFile()) { if (dir.endsWith('.json')) out.push(dir); return out; }
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.json')) out.push(p);
  }
  return out;
}

export function buildManifest() {
  // anything not claimed by a pack (and not the Bible editions, which download on their own) goes in a last pack, so nothing is left out of "download everything"
  const claimed = new Set(PACKS.flatMap((p) => p.dirs).concat(['bible', 'manifest.json']));
  const rest = readdirSync(PUBLIC_DATA).filter((f) => !claimed.has(f));
  const all = [...PACKS, { id: 'more', label: 'Everything else (art lists, licenses, manuscripts and small tables)', dirs: rest }];
  const packs = all.map((p) => {
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
