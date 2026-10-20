import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseRefs, refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { BOOK_BY_ID } from '../../src/lib/canon';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/**
 * "Lens" datasets: short editorial notes that explain a passage from one angle (how the New Testament quotes the Old, what
 * the manuscripts witness, what the archaeology shows, how a passage is built, where a translation hides a distinction…).
 * They are written for this app in its own words and labelled as such; each entry says how firm its claim is (`status`).
 * References are written in ordinary (English) numbering and converted to the app's anchor numbering here.
 *
 * Source: data/curated/lens/<type>.json  →  public/data/lens/<type>.json
 */
const STATUS = new Set(['attested', 'documented', 'supported', 'proposed', 'traditional', 'disputed', 'textual-fact', 'interpretive', 'editorial']);
const REQUIRED: Record<string, string[]> = {
  quotes: ['refs', 'alt', 'note'],
  customs: ['refs', 'title', 'note', 'status'],
  structure: ['refs', 'title', 'kind', 'status', 'parts'],
  wordnotes: ['refs', 'title', 'note', 'kind'],
  versions: ['refs', 'title', 'note'],
  witnesses: ['refs', 'title', 'note', 'date', 'where'],
  parallels: ['refs', 'alt', 'note'],
  echoes: ['refs', 'title', 'note'],
  genre: ['refs', 'title', 'note'],
  dependency: ['refs', 'title', 'chain'],
  motifs: ['title', 'stages'],
  vocabulary: ['title', 'note'],
  people: ['title', 'note'],
  reception: ['refs', 'title', 'stages'],
};

export function buildLens(report: Report) {
  const dir = join(CURATED, 'lens');
  if (!exists(dir)) return;
  const eds = readJson(join(PUBLIC_DATA, 'editions.json')).editions;
  const vc: Record<string, number[]> = eds.find((e: any) => e.id === 'vulgate').verseCounts;
  const english: Record<string, number[]> = eds.find((e: any) => e.scheme === 'english').verseCounts;

  const toAnchors = (where: string, texts: string[]): string[] => {
    const out: string[] = [];
    for (const text of texts) {
      for (const part of text.split(/;\s*/)) {
        const s = part.trim();
        if (!s) continue;
        const p = parseRefs(s);
        if (!p.ok) {
          report.error(`lens: ${where}: cannot parse reference "${s}"`);
          continue;
        }
        for (const { ref } of p.refs as { ref: Ref }[]) {
          const counts = english[ref.book] ?? vc[ref.book];
          if (!counts) {
            report.error(`lens: ${where}: no verse counts for ${ref.book}`);
            continue;
          }
          for (const [c, v] of [[ref.c1, ref.v1], [ref.c2, ref.v2]] as [number, number | undefined][]) {
            if (c < 1 || c > counts.length + 1) report.error(`lens: ${where}: "${s}" chapter ${c} is outside ${BOOK_BY_ID[ref.book]?.name} (${counts.length} chapters)`);
            else if (v && counts[c - 1] && v > counts[c - 1] + 6) report.error(`lens: ${where}: "${s}" verse ${v} is beyond chapter ${c} (${counts[c - 1]} verses)`);
          }
          // whole-chapter references stay whole-chapter
          const a = toAnchor('kjv', ref.book, ref.c1, ref.v1 ?? 1);
          if (ref.v1 === undefined) {
            out.push(refId({ book: ref.book, c1: a.c, c2: toAnchor('kjv', ref.book, ref.c2, 1).c }));
            continue;
          }
          const b = ref.v2 !== undefined ? toAnchor('kjv', ref.book, ref.c2, ref.v2) : a;
          out.push(refId({ book: ref.book, c1: a.c, v1: a.v1, c2: b.c, v2: Math.max(b.v2, a.v1) }));
        }
      }
    }
    return out;
  };

  const stats: Record<string, number> = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const type = f.replace(/\.json$/, '');
    const src = readJson(join(dir, f));
    const entries: any[] = src.entries ?? [];
    const req = REQUIRED[type] ?? ['title'];
    const out: any[] = [];
    entries.forEach((e, i) => {
      const where = `${type}[${i}] ${e.title ?? e.note?.slice(0, 40) ?? ''}`;
      for (const k of req) if (e[k] === undefined || e[k] === '' || (Array.isArray(e[k]) && !e[k].length)) report.error(`lens: ${where}: missing "${k}"`);
      if (e.status && !STATUS.has(e.status)) report.error(`lens: ${where}: unknown status "${e.status}"`);
      const o: any = { ...e, id: `${type}-${i}` };
      if (Array.isArray(e.refs)) o.a = toAnchors(where, e.refs);
      if (Array.isArray(e.alt)) o.b = toAnchors(where, e.alt);
      delete o.refs;
      delete o.alt;
      // nested references (structure parts, dependency chains, motif stages, reception stages)
      for (const key of ['parts', 'chain', 'stages']) {
        if (Array.isArray(e[key])) o[key] = e[key].map((p: any) => (p.ref ? { ...p, a: toAnchors(where + ' › ' + (p.label ?? p.note ?? ''), [p.ref]) , ref: undefined } : p));
      }
      out.push(o);
    });
    writeJson(join(PUBLIC_DATA, 'lens', `${type}.json`), { about: src._about ?? '', entries: out });
    stats[type] = out.length;
  }
  report.stats['lens'] = stats;
}
