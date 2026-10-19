import { unzipSync } from 'fflate';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { decodeEntities } from './lib/thml';
import { PUBLIC_DATA, RAW, Report, exists, today, writeJson } from './lib/util';
import { BOOK_BY_ID } from '../../src/lib/canon';

/** MyBible book numbers → canon ids (the module covers the protocanonical books). */
const NUM: Record<number, string> = {
  10: 'GEN', 20: 'EXO', 30: 'LEV', 40: 'NUM', 50: 'DEU', 60: 'JOS', 70: 'JDG', 80: 'RUT', 90: '1SA', 100: '2SA', 110: '1KI', 120: '2KI', 130: '1CH', 140: '2CH',
  150: 'EZR', 160: 'NEH', 190: 'EST', 220: 'JOB', 230: 'PSA', 240: 'PRO', 250: 'ECC', 260: 'SNG', 290: 'ISA', 300: 'JER', 310: 'LAM', 330: 'EZK', 340: 'DAN',
  350: 'HOS', 360: 'JOL', 370: 'AMO', 380: 'OBA', 390: 'JON', 400: 'MIC', 410: 'NAM', 420: 'HAB', 430: 'ZEP', 440: 'HAG', 450: 'ZEC', 460: 'MAL',
  470: 'MAT', 480: 'MRK', 490: 'LUK', 500: 'JHN', 510: 'ACT', 520: 'ROM', 530: '1CO', 540: '2CO', 550: 'GAL', 560: 'EPH', 570: 'PHP', 580: 'COL',
  590: '1TH', 600: '2TH', 610: '1TI', 620: '2TI', 630: 'TIT', 640: 'PHM', 650: 'HEB', 660: 'JAS', 670: '1PE', 680: '2PE', 690: '1JN', 700: '2JN', 710: '3JN',
  720: 'JUD', 730: 'REV',
};

const text = (h: string) =>
  decodeEntities(h.replace(/<br\s*\/?>/g, '\n').replace(/<\/p>\s*<p>/g, '\n\n').replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Haydock's Catholic Bible Commentary (verse-by-verse notes, Vulgate/Douay numbering — the anchor numbering). */
export function buildHaydock(report: Report) {
  const zip = join(RAW, 'haydock.mybible.zip');
  if (!exists(zip)) return report.warn('haydock: not fetched');
  const files = unzipSync(new Uint8Array(readFileSync(zip)));
  const name = Object.keys(files).find((k) => k.endsWith('.SQLite3') || k.endsWith('.sqlite3'))!;
  const dir = join(RAW, 'haydock');
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, 'haydock.sqlite3');
  writeFileSync(dbPath, files[name]);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const info = Object.fromEntries((db.prepare('select name, value from info').all() as any[]).map((r) => [r.name, r.value]));
  if (!/public domain/i.test(info.detailed_info ?? '')) throw new Error('haydock: module does not state Public Domain');
  const rows = db.prepare('select book_number b, chapter_number_from c1, verse_number_from v1, chapter_number_to c2, verse_number_to v2, text t from commentaries order by b, c1, v1').all() as any[];
  const out = new Map<string, any[]>();
  let n = 0;
  let unknown = 0;
  for (const r of rows) {
    const book = NUM[r.b];
    if (!book || !BOOK_BY_ID[book]) {
      unknown++;
      continue;
    }
    const t = text(r.t);
    if (!t) continue;
    (out.get(book) ?? out.set(book, []).get(book)!).push([r.c1, r.v1, r.c2, r.v2, t]);
    n++;
  }
  for (const [book, list] of out) writeJson(join(PUBLIC_DATA, 'commentary/haydock', `${book}.json`), list);
  writeJson(
    join(PUBLIC_DATA, 'commentary/haydock/_meta.json'),
    {
      work: "Haydock's Catholic Bible Commentary",
      author: 'George Leo Haydock (1774–1849), compiling notes of the Fathers, Calmet, Challoner and others',
      edition: 'First published 1811; Douay-Rheims edition with commentary, 1859',
      module: `MyBible module prepared by SermonIndex.net (${info.history_of_changes ?? ''})`,
      rights: 'public-domain',
      rightsEvidence: 'Work published 1811/1859 (author died 1849); the SermonIndex module states "Public domain". Module date 2026 is a transcription, not a new work of authorship; flagged for periodic review.',
      url: 'https://www.sermonindex.net/commentary/haydock-c/',
      retrieved: today(),
      numbering: 'Vulgate/Douay (matches the anchor)',
      coverage: 'Protocanonical books only; the deuterocanon is not in this module.',
      entries: n,
    },
    true,
  );
  report.stats['haydock'] = { entries: n, books: out.size, skippedUnknownBook: unknown };
}
