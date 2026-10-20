import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';
import { parseRefs } from '../../src/lib/refs';

/**
 * More pictures for the reader: Doré's 1866 Bible engravings and open-access museum paintings (data/curated/art-*.json other than the
 * original Met set). Each work names the passage it depicts; the images are shipped under public/art. Works whose image file is
 * missing or whose reference does not parse are left out with a warning.
 */
export function buildArtMore(report: Report) {
  const files = readdirSync(CURATED).filter((f) => /^art-.+\.json$/.test(f));
  const works: any[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    const d = readJson(join(CURATED, f));
    for (const w of d.works ?? []) {
      if (!w.id || seen.has(w.id)) continue;
      if (!exists(join(PUBLIC_DATA, '..', w.file))) { report.warn(`art-more: ${w.id}: image ${w.file} missing`); continue; }
      const refs = (w.refs ?? []).filter((r: string) => parseRefs(r).ok);
      if (!refs.length || !w.title || !w.credit) { report.warn(`art-more: ${w.id}: bad refs or missing title/credit`); continue; }
      seen.add(w.id);
      works.push({ id: w.id, title: w.title, artist: w.artist ?? '', date: w.date ?? '', credit: w.credit, source: w.source ?? '', file: w.file, refs, theme: w.theme ?? '' });
    }
  }
  writeJson(join(PUBLIC_DATA, 'art-more.json'), { works });
  report.stats['art-more'] = works.length;
}
