import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { PUBLIC_DATA, Report, readJson, writeJson } from './lib/util';

const KIND: Record<string, string> = { homily: 'hom', tractate: 'tract', letter: 'ep', epistle: 'ep', sermon: 'serm' };
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
const roman = (s: string) => [...s].reduce((n, ch, i, a) => n + ((ROMAN[ch] ?? 0) < (ROMAN[a[i + 1]] ?? 0) ? -(ROMAN[ch] ?? 0) : ROMAN[ch] ?? 0), 0);

/**
 * Where "hom. 85", "tract. 26" or "ep. 63" lands inside the library: for each work, the section whose own heading names that
 * homily, tractate, letter or sermon number (section positions do not equal the printed numbers). Lets the commentary
 * citations that mention a Father's work open the text itself.
 */
export function buildCiteIndex(report: Report) {
  const dir = join(PUBLIC_DATA, 'library', 'works');
  const out: Record<string, Record<string, Record<number, number>>> = {};
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const w = readJson(join(dir, f));
    w.sections.forEach((s: any, i: number) => {
      const m = /^(Homily|Tractate|Letter|Epistle|Sermon)\s+([IVXLC]+)\b/.exec((s.paras?.[0] ?? '').trim());
      if (!m) return;
      const k = KIND[m[1].toLowerCase()];
      const num = roman(m[2]);
      if (!num) return;
      const by = ((out[w.id] ??= {})[k] ??= {});
      if (by[num] === undefined) { by[num] = i; n++; }
    });
  }
  writeJson(join(PUBLIC_DATA, 'library', 'cite-index.json'), out);
  report.stats['cite-index'] = n;
}
