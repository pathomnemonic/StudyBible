import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/**
 * Daily reflection: a verse reference, a saint quote and a reflection question per calendar day (data/curated/daily.json) plus
 * season-specific entries (data/curated/daily-season/*.json: Advent, Christmas, Lent, Easter days). Seasonal quotes were checked
 * word for word against the library texts; `verified` marks which generic quotes were too.
 */
export function buildDaily(report: Report) {
  const src = join(CURATED, 'daily.json');
  if (!exists(src)) return;
  const generic: Record<string, any> = {};
  for (const e of readJson(src).entries) {
    generic[e.key] = { ref: e.ref, saint: e.saint, q: e.question };
  }
  const seasonal: Record<string, any> = {};
  const dir = join(CURATED, 'daily-season');
  if (exists(dir)) {
    const works = new Map<string, any>();
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      for (const [k, e] of Object.entries<any>(readJson(join(dir, f)))) {
        let verified = false;
        try {
          if (!works.has(e.work)) works.set(e.work, readJson(join(PUBLIC_DATA, 'library', 'works', `${e.work}.json`)));
          verified = works.get(e.work).sections[e.section].paras[e.para].includes(e.quote);
        } catch { /* leave unverified */ }
        if (!verified) { report.warn(`daily: quote for ${k} not found word for word in ${e.work}`); continue; }
        seasonal[k] = { ref: e.ref, saint: { text: e.quote, who: e.who, verified: true }, q: e.question };
      }
    }
  }
  writeJson(join(PUBLIC_DATA, 'daily', 'index.json'), { generic, seasonal });
  report.stats['daily'] = Object.keys(generic).length + Object.keys(seasonal).length;
}
