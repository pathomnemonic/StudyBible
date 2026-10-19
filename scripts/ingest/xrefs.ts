import { unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOK_BY_ID } from '../../src/lib/canon';
import { refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { PUBLIC_DATA, RAW, Report, writeJson } from './lib/util';

/** OpenBible.info book codes → canon ids (the dataset covers the 66 protocanonical books). */
export const OPENBIBLE_BOOKS: Record<string, string> = {
  Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA',
  '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB', Ps: 'PSA', Prov: 'PRO',
  Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA',
  Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP', Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL', Matt: 'MAT', Mark: 'MRK', Luke: 'LUK',
  John: 'JHN', Acts: 'ACT', Rom: 'ROM', '1Cor': '1CO', '2Cor': '2CO', Gal: 'GAL', Eph: 'EPH', Phil: 'PHP', Col: 'COL', '1Thess': '1TH',
  '2Thess': '2TH', '1Tim': '1TI', '2Tim': '2TI', Titus: 'TIT', Phlm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pet': '1PE', '2Pet': '2PE',
  '1John': '1JN', '2John': '2JN', '3John': '3JN', Jude: 'JUD', Rev: 'REV',
};

const MAX_PER_VERSE = 12;

function parseOne(s: string): { book: string; c: number; v: number } | null {
  const m = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/.exec(s);
  if (!m) return null;
  const book = OPENBIBLE_BOOKS[m[1]];
  return book ? { book, c: +m[2], v: +m[3] } : null;
}

/** English-tradition verse → Vulgate anchor verse (start,end). */
function anchorOf(p: { book: string; c: number; v: number }) {
  return toAnchor('kjv', p.book, p.c, p.v);
}

export function buildXrefs(report: Report) {
  const zip = unzipSync(new Uint8Array(readFileSync(join(RAW, 'cross-references.zip'))));
  const name = Object.keys(zip).find((k) => k.endsWith('.txt'))!;
  const lines = new TextDecoder().decode(zip[name]).split('\n');
  const perBook = new Map<string, Map<string, Map<string, number>>>();
  let bad = 0;
  let kept = 0;
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [from, to, votesS] = line.split('\t');
    const votes = parseInt(votesS, 10);
    if (!(votes > 0)) continue;
    const f = parseOne(from);
    const [t1s, t2s] = to.split('-');
    const t1 = parseOne(t1s);
    const t2 = t2s ? parseOne(t2s) : t1;
    if (!f || !t1 || !t2) {
      bad++;
      continue;
    }
    const fa = anchorOf(f);
    const a = anchorOf(t1);
    const b = anchorOf(t2);
    const target: Ref = a.c === b.c && t1.book === t2.book && a.v1 === b.v2 ? { book: t1.book, c1: a.c, v1: a.v1, c2: a.c, v2: a.v1 } : { book: t1.book, c1: a.c, v1: a.v1, c2: b.c, v2: b.v2 };
    // a range that goes backwards after mapping is a data problem; fall back to the first verse only
    if (target.c2 < target.c1 || (target.c2 === target.c1 && (target.v2 ?? 0) < (target.v1 ?? 0))) {
      target.c2 = target.c1;
      target.v2 = target.v1;
    }
    const key = `${fa.c}.${fa.v1}`;
    const bookMap = perBook.get(f.book) ?? perBook.set(f.book, new Map()).get(f.book)!;
    const verseMap = bookMap.get(key) ?? bookMap.set(key, new Map()).get(key)!;
    const id = refId(target);
    verseMap.set(id, Math.max(verseMap.get(id) ?? 0, votes));
    kept++;
  }
  let files = 0;
  for (const [book, m] of perBook) {
    const out: Record<string, [string, number][]> = {};
    for (const [key, targets] of m) out[key] = [...targets.entries()].sort((x, y) => y[1] - x[1]).slice(0, MAX_PER_VERSE);
    writeJson(join(PUBLIC_DATA, 'xrefs', `${book}.json`), out);
    files++;
  }
  // Provenance for the pack
  writeJson(
    join(PUBLIC_DATA, 'xrefs/_provenance.json'),
    {
      source: 'OpenBible.info Cross References',
      url: 'https://www.openbible.info/labs/cross-references/',
      license: 'CC BY 4.0',
      attribution: 'Cross references from OpenBible.info (CC BY). Votes are community-sourced relevance scores, not Church teaching. Converted from KJV numbering to the Vulgate anchor by this app.',
      keptPerVerse: MAX_PER_VERSE,
    },
    true,
  );
  report.stats['xrefs'] = { pairsKept: kept, unparsed: bad, books: files };
  void BOOK_BY_ID;
}
