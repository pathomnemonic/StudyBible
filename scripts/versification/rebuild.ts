/**
 * Rebuilds public/data/versification.json from the edition files already in public/data/bible, without the publishers'
 * downloads. It runs exactly the code the full ingest runs (`buildVersification` in scripts/ingest/bible.ts), so a rule
 * added to `data/versification/verified-chapters.json` reaches all three numbering tables (english, kjv, nabre) the same
 * way it would in a full `npm run data:build`.
 *
 *   npx tsx scripts/versification/rebuild.ts            rewrite the file
 *   npx tsx scripts/versification/rebuild.ts --check    exit 1 if the shipped file differs from what the code produces
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BookData } from '../../src/lib/types';
import { buildVersification, type BuiltEdition } from '../ingest/bible';
import { PUBLIC_DATA, Report } from '../ingest/lib/util';

const editions = JSON.parse(readFileSync(join(PUBLIC_DATA, 'editions.json'), 'utf8')).editions as any[];
const load = (id: string): BuiltEdition => {
  const edition = editions.find((e) => e.id === id);
  if (!edition) throw new Error(`no edition ${id} in editions.json`);
  const books = new Map<string, BookData>();
  for (const code of Object.keys(edition.chapters)) books.set(code, JSON.parse(readFileSync(join(PUBLIC_DATA, 'bible', id, `${code}.json`), 'utf8')));
  return { edition, books } as BuiltEdition;
};
const report = new Report();
const out = buildVersification(load('dra'), load('vulgate'), load('webc'), report, load('nabre'));
const file = join(PUBLIC_DATA, 'versification.json');
const next = JSON.stringify(out);
const prev = readFileSync(file, 'utf8');
const same = JSON.stringify(JSON.parse(prev)) === next;
if (process.argv.includes('--check')) {
  // (the check covers versification.json only)
  console.log(same ? 'versification.json matches what the code produces' : 'versification.json DIFFERS from what the code produces');
  process.exit(same ? 0 : 1);
}
if (!same) writeFileSync(file, next);
// the edition record carries a copy of the flags so the reader can show them without loading the rules (as buildBible does)
const edFile = join(PUBLIC_DATA, 'editions.json');
const eds = JSON.parse(readFileSync(edFile, 'utf8'));
const web = eds.editions.find((e: any) => e.id === 'webc');
if (JSON.stringify(web.numberingDiffers) !== JSON.stringify(out.schemes.english.unverifiedChapters)) {
  web.numberingDiffers = out.schemes.english.unverifiedChapters;
  web.unalignedBooks = out.schemes.english.unalignedBooks;
  writeFileSync(edFile, JSON.stringify(eds));
  console.log('editions.json: webc numbering flags updated');
}
console.log(same ? 'unchanged' : 'versification.json rewritten');
for (const [k, s] of Object.entries(out.schemes)) console.log(k, s.rules.length, 'rules;', Object.values(s.unverifiedChapters).reduce((a, b) => a + b.length, 0), 'unverified chapters');
