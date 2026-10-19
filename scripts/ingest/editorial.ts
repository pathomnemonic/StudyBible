import { join } from 'node:path';
import { BOOK_BY_ID } from '../../src/lib/canon';
import { parseRefs } from '../../src/lib/refs';
import { CURATED, PUBLIC_DATA, Report, readJson, writeJson } from './lib/util';

/**
 * Editorial reference data written for this app (book introductions and outlines, indexes of parables/miracles/prophecies/covenants,
 * the Gospel synopsis, Pauline argument outlines, genealogies). Every reference is parsed and bounds-checked at build time.
 */
export function buildEditorial(report: Report) {
  const src = join(CURATED, 'reference');
  const eds = readJson(join(PUBLIC_DATA, 'editions.json')).editions;
  const vc: Record<string, number[]> = eds.find((e: any) => e.id === 'vulgate').verseCounts;
  const english: Record<string, number[]> = eds.find((e: any) => e.scheme === 'english').verseCounts;
  let refs = 0;
  const check = (where: string, text: string, book?: string) => {
    for (const part of text.split(/;\s*/)) {
      const s = part.trim();
      if (!s) continue;
      const p = parseRefs(book && /^\d/.test(s) ? `${book} ${s}` : s);
      if (!p.ok) {
        report.error(`editorial: ${where}: cannot parse reference "${s}"`);
        continue;
      }
      for (const { ref } of p.refs) {
        refs++;
        const counts = ref.book === 'PSA' ? english.PSA : vc[ref.book]; // refs are in English numbering
        if (!counts) {
          report.error(`editorial: ${where}: no verse counts for ${ref.book}`);
          continue;
        }
        for (const [c, v] of [[ref.c1, ref.v1], [ref.c2, ref.v2]] as [number, number | undefined][]) {
          if (c < 1 || c > counts.length + 1) report.error(`editorial: ${where}: "${s}" chapter ${c} is outside ${BOOK_BY_ID[ref.book]?.name} (${counts.length} chapters)`);
          else if (v && counts[c - 1] && v > counts[c - 1] + 6) report.error(`editorial: ${where}: "${s}" verse ${v} is beyond chapter ${c} (${counts[c - 1]} verses)`);
        }
      }
    }
  };

  const books = readJson(join(src, 'books.json'));
  for (const id of Object.keys(BOOK_BY_ID)) if (!books[id]) report.error(`editorial: books.json lacks ${id}`);
  for (const [id, b] of Object.entries<any>(books)) for (const [range, title] of b.outline) {
    if (!title) report.error(`editorial: ${id} outline entry without title`);
    check(`books.${id}`, range, BOOK_BY_ID[id]?.name);
  }
  const idx = readJson(join(src, 'indexes.json'));
  for (const [kind, rows] of Object.entries<any[]>(idx)) for (const r of rows) {
    check(`indexes.${kind}.${r[0]}`, r[1]);
    if (kind === 'prophecies') check(`indexes.prophecies.${r[0]}`, r[2]);
  }
  const syn = readJson(join(src, 'synopsis.json'));
  for (const r of syn.rows) for (const c of r.slice(1)) if (c) check(`synopsis.${r[0]}`, c);
  const paul = readJson(join(src, 'pauline.json'));
  for (const [id, l] of Object.entries<any>(paul.letters)) for (const s of l.sections) check(`pauline.${id}`, s[0], BOOK_BY_ID[id]?.name);
  const gen = readJson(join(src, 'genealogies.json'));
  const ids = new Set(gen.persons.map((p: any) => p.id));
  for (const p of gen.persons) {
    for (const k of ['f', 'm']) if (p[k] && !ids.has(p[k])) report.error(`editorial: genealogies: ${p.id}.${k} -> unknown ${p[k]}`);
    if (p.r) check(`genealogies.${p.id}`, p.r);
  }
  for (const f of ['books', 'indexes', 'synopsis', 'pauline', 'genealogies']) writeJson(join(PUBLIC_DATA, 'reference', `${f}.json`), readJson(join(src, `${f}.json`)));
  report.stats['editorial'] = { books: Object.keys(books).length, references: refs, persons: gen.persons.length, synopsisRows: syn.rows.length, parables: idx.parables.length, miracles: idx.miracles.length, prophecies: idx.prophecies.length, covenants: idx.covenants.length };
}
