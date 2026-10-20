import { join } from 'node:path';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/** The Church-documents page: public-domain texts that are read in full inside the app, and the rest as link-only entries (title, official URL, one-line description; never the text). */
export function buildChurchIndex(report: Report) {
  const f = join(CURATED, 'church-docs-index.json');
  if (!exists(f)) return;
  const docs = readJson(f);
  writeJson(join(PUBLIC_DATA, 'church', 'docs.json'), { docs });
  report.stats['church-docs'] = docs.length;
}
