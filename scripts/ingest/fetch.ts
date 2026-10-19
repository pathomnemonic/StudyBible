import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PROVENANCE, RAW, readJson, REGISTRY, sha256, today, writeJson, exists } from './lib/util';

interface FetchEntry {
  id: string;
  url: string;
  file: string;
  terms: string;
  rights: string;
  note: string;
}

/** Download every source in data/registry/fetch.json (and fetch.extra.json) into data/raw/, recording checksums. */
export async function fetchAll(only?: string[]) {
  mkdirSync(RAW, { recursive: true });
  mkdirSync(PROVENANCE, { recursive: true });
  const entries: FetchEntry[] = [];
  entries.push(...readJson(join(REGISTRY, 'fetch.json')).sources);
  for (const w of readJson(join(REGISTRY, 'library.json')).works) {
    entries.push({
      id: `ccel-${w.id}`,
      url: `https://www.ccel.org/ccel/${w.ccel}.xml`,
      file: `ccel-${w.id}.xml`,
      terms: 'https://ccel.org/ccel/' + w.ccel.split('/')[0],
      rights: 'public-domain',
      note: `${w.title}, ${w.author}. Public-domain text distributed by CCEL as ThML.`,
    });
  }
  const prov: Record<string, unknown> = exists(join(PROVENANCE, 'fetched.json')) ? readJson(join(PROVENANCE, 'fetched.json')) : {};
  for (const e of entries) {
    if (only && only.length && !only.includes(e.id)) continue;
    const dest = join(RAW, e.file);
    if (exists(dest) && statSync(dest).size > 0 && !process.env.REFETCH) {
      console.log(`= ${e.id} (cached)`);
    } else {
      console.log(`↓ ${e.id}  ${e.url}`);
      try {
        execFileSync('curl', ['-fsSL', '--retry', '4', '--retry-delay', '3', '--retry-all-errors', '-m', '180', '-o', dest, e.url], { stdio: 'inherit' });
      } catch {
        console.error(`!! could not fetch ${e.id}`);
        continue;
      }
      await new Promise((r) => setTimeout(r, 800)); // be polite to the publisher's server
    }
    const buf = readFileSync(dest);
    prov[e.id] = { url: e.url, file: e.file, bytes: buf.length, sha256: sha256(buf), retrieved: today(), terms: e.terms, rights: e.rights, note: e.note };
  }
  writeJson(join(PROVENANCE, 'fetched.json'), prov, true);
  console.log('fetch complete');
}
