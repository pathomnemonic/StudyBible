import { join } from 'node:path';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { PUBLIC_DATA, Report, writeJson } from './lib/util';

/** Cuts the people and names files into chunks of 200 so the panel loads only the few it needs; the whole files are removed afterwards (rebuilt every build). */
const CHUNK = 200;
export function buildNamesIndex(report: Report) {
  const dir = join(PUBLIC_DATA, 'reference');
  let n = 0;
  const step = join(dir, 'step/names.json');
  if (existsSync(step)) {
    const all: any[] = JSON.parse(readFileSync(step, 'utf8'));
    for (let i = 0; i < all.length; i += CHUNK) writeJson(join(dir, `step/names-${i / CHUNK}.json`), all.slice(i, i + CHUNK).map((e) => ({ name: e.name, kind: e.kind, type: e.type, meaning: e.meaning, notes: (e.notes ?? []).slice(0, 1) })));
    n += all.length;
    unlinkSync(step);
  }
  const peo = join(dir, 'theographic/people.json');
  if (existsSync(peo)) {
    const all: any[] = JSON.parse(readFileSync(peo, 'utf8'));
    for (let i = 0; i < all.length; i += CHUNK) writeJson(join(dir, `theographic/people-${i / CHUNK}.json`), all.slice(i, i + CHUNK).map((e) => ({ name: e.name, aliases: e.aliases, gender: e.gender, father: e.father, mother: e.mother, siblings: e.siblings, partners: e.partners, children: e.children, first: e.first })));
    n += all.length;
    unlinkSync(peo);
  }
  // the Catholic Encyclopedia: which articles cite which verses (a book's own article reaches the whole book)
  const enc = join(PUBLIC_DATA, 'encyclopedia/index.json');
  if (existsSync(enc)) {
    const arts: { slug: string; title: string; kind: string; words: number; book?: string; cites?: string[] }[] = JSON.parse(readFileSync(enc, 'utf8')).articles;
    const byBook: Record<string, number[][]> = {};
    arts.forEach((a, idx) => {
      const seen = new Set<string>();
      for (const c of a.cites ?? []) {
        const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)$/.exec(c);
        if (!m || seen.has(c)) continue;
        seen.add(c);
        (byBook[m[1]] ??= []).push([+m[2], +m[3], +m[2], +m[3], idx]);
      }
      if (a.kind === 'book' && a.book) (byBook[a.book] ??= []).push([1, 1, 999, 999, idx]);
    });
    for (const [b, rows] of Object.entries(byBook)) writeJson(join(PUBLIC_DATA, 'encyclopedia/by-book', `${b}.json`), rows);
    writeJson(join(PUBLIC_DATA, 'encyclopedia/list.json'), arts.map((a) => ({ slug: a.slug, title: a.title, kind: a.kind, words: a.words })));
    n += arts.length;
  }
  report.stats['names-index'] = { entries: n };
}
