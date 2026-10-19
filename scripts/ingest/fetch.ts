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
  const seenCcel = new Set<string>();
  for (const w of readJson(join(REGISTRY, 'library.json')).works) {
    if (seenCcel.has(w.ccel)) continue; // several works can share one CCEL volume
    seenCcel.add(w.ccel);
    entries.push({
      id: `ccel-${w.ccel.replace('/', '_')}`,
      url: `https://www.ccel.org/ccel/${w.ccel}.xml`,
      file: `ccel_${w.ccel.replace('/', '_')}.xml`,
      terms: 'https://ccel.org/ccel/' + w.ccel.split('/')[0],
      rights: 'public-domain',
      note: `${w.title}, ${w.author}. Public-domain text distributed by CCEL as ThML.`,
    });
  }
  for (const d of readJson(join(REGISTRY, 'church-documents.json')).documents) {
    entries.push({
      id: `church-${d.id}`,
      url: d.url,
      file: `church_${d.id}.html`,
      terms: 'https://www.vatican.va/robots.txt',
      rights: 'copyright-lev',
      note: `${d.title} (${d.author}, ${d.date}). Fetched only to read article numbers and Scripture references; the text is not stored or redistributed.`,
    });
  }
  // shallow git clones (original-language data lives in public git repositories)
  const gitDir = join(RAW, 'repos');
  mkdirSync(gitDir, { recursive: true });
  const gitProv: Record<string, string> = {};
  for (const r of readJson(join(REGISTRY, 'original-sources.json')).repos) {
    if (only && only.length && !only.includes(`git-${r.id}`)) continue;
    const dest = join(gitDir, r.id);
    if (!exists(join(dest, '.git'))) {
      console.log(`↓ git-${r.id}  ${r.url}`);
      try {
        execFileSync('git', ['clone', '-q', '--depth', '1', r.url, dest], { stdio: 'inherit', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } });
      } catch {
        console.error(`!! could not clone ${r.id}`);
        continue;
      }
    } else console.log(`= git-${r.id} (cached)`);
    gitProv[r.id] = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD']).toString().trim();
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
      await new Promise((r) => setTimeout(r, e.url.includes('vatican.va') ? 2200 : 800)); // be polite (vatican.va asks for a 2 s crawl delay) to the publisher's server
    }
    const buf = readFileSync(dest);
    prov[e.id] = { url: e.url, file: e.file, bytes: buf.length, sha256: sha256(buf), retrieved: today(), terms: e.terms, rights: e.rights, note: e.note };
  }
  prov['_git'] = { ...((prov['_git'] as object) ?? {}), ...gitProv };
  writeJson(join(PROVENANCE, 'fetched.json'), prov, true);
  console.log('fetch complete');
}
