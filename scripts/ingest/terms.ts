import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { parseRefs } from '../../src/lib/refs';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/**
 * Key words and phrases: curated notes (data/curated/terms.json) plus, for each, where it occurs. Occurrences are found by
 * matching the term's patterns against the Douay-Rheims text (Vulgate numbering, the app's anchors), so counts follow that
 * translation's wording.
 */
export function buildTerms(report: Report) {
  // English translations of Latin glosses (made for this app; see data/curated/glossa-en)
  const gdir = join(CURATED, 'glossa-en');
  if (exists(gdir)) {
    let n = 0;
    for (const f of readdirSync(gdir).filter((x) => x.endsWith('.json'))) {
      const d = readJson(join(gdir, f));
      writeJson(join(PUBLIC_DATA, 'commentary', 'glossa-en', f), d);
      n += Object.keys(d).length;
    }
    report.stats['glossa-en'] = n;
  }
  const src = join(CURATED, 'terms.json');
  if (!exists(src)) return;
  const terms: any[] = readJson(src).terms;
  const dir = join(PUBLIC_DATA, 'bible', 'dra');
  const books = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  const regs = terms.map((t) => new RegExp(`\\b(?:${t.en.join('|')})`, 'gi'));
  const hits: Record<string, { book: string; c: number; v: number }[]> = Object.fromEntries(terms.map((t) => [t.id, []]));
  for (const b of books) {
    const data = readJson(join(dir, `${b}.json`));
    data.chapters.forEach((ch: any, ci: number) => {
      const verses = new Map<number, string>();
      let cur = 0;
      for (const blk of ch.blocks) {
        if (typeof blk[1] === 'string') continue;
        for (const [v, text] of blk[1] as [number, string][]) {
          if (v > 0) cur = v;
          if (cur) verses.set(cur, (verses.get(cur) ?? '') + ' ' + text);
        }
      }
      for (const [v, text] of verses) terms.forEach((t, i) => { regs[i].lastIndex = 0; if (regs[i].test(text)) hits[t.id].push({ book: b, c: ch.n ?? ci + 1, v }); });
    });
  }
  const ids = new Set(terms.map((t) => t.id));
  const index: any[] = [];
  for (const t of terms) {
    for (const p of t.passages) if (!parseRefs(p.ref).ok) report.error(`terms: ${t.id}: cannot parse "${p.ref}"`);
    for (const r of t.related) if (!ids.has(r)) report.error(`terms: ${t.id}: unknown related term "${r}"`);
    const list = hits[t.id];
    const byBook: Record<string, number> = {};
    for (const h of list) byBook[h.book] = (byBook[h.book] ?? 0) + 1;
    if (!list.length && t.id !== 'selah') report.warn(`terms: ${t.id}: no occurrences found in the Douay-Rheims`);
    writeJson(join(PUBLIC_DATA, 'terms', `${t.id}.json`), { ...t, total: list.length, byBook, verses: list.slice(0, 600).map((h) => `${h.book}.${h.c}.${h.v}`) });
    index.push({ id: t.id, title: t.title, kind: t.kind, en: t.en, la: t.la, gist: t.gist, total: list.length });
  }
  writeJson(join(PUBLIC_DATA, 'terms', 'index.json'), { terms: index });
  report.stats['terms'] = terms.length;
}
