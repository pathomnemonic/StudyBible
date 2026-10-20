import { join } from 'node:path';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/**
 * Daily Mass reading references (facts such as "Ephesians 2:12-22"), collected from the USCCB daily readings pages by
 * scripts/fetch-readings.py + scripts/lectionary-curate.py into data/curated/lectionary-refs.json. No Lectionary text is stored;
 * the app shows the passages in the reader's own translation. Split per year for lazy loading.
 */
export function buildLectionary(report: Report) {
  const src = join(CURATED, 'lectionary-refs.json');
  if (!exists(src)) return;
  const d = readJson(src);
  const byYear: Record<string, Record<string, unknown>> = {};
  for (const [date, v] of Object.entries<any>(d.days)) (byYear[date.slice(0, 4)] ??= {})[date] = v;
  for (const [y, days] of Object.entries(byYear)) writeJson(join(PUBLIC_DATA, 'lectionary', `${y}.json`), { source: d._about, days });
  report.stats['lectionary-days'] = Object.keys(d.days).length;
}
