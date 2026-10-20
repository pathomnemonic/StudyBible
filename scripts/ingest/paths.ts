import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { CURATED, PUBLIC_DATA, Report, exists, readJson, writeJson } from './lib/util';

/**
 * Study paths: guided journeys through a theme (data/curated/paths/*.json). Each step has a passage, a short editorial
 * introduction, one Father or saint quotation and a question. Every quotation is checked word for word against the library text
 * it cites; a step whose quote does not match loses its quote (and a warning is recorded) rather than shipping something unverified.
 */
export function buildPaths(report: Report) {
  const dir = join(CURATED, 'paths');
  if (!exists(dir)) return;
  const works = new Map<string, any>();
  const index: any[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const p = readJson(join(dir, f));
    for (const st of p.steps) {
      const q = st.quote;
      if (!q) continue;
      let ok = false;
      try {
        if (!works.has(q.work)) works.set(q.work, readJson(join(PUBLIC_DATA, 'library', 'works', `${q.work}.json`)));
        ok = works.get(q.work).sections[q.section].paras[q.para].includes(q.text);
      } catch { /* not found */ }
      if (!ok) { report.warn(`paths: ${p.id} “${st.title}”: quote not found word for word in ${q.work}; dropped`); st.quote = null; }
    }
    writeJson(join(PUBLIC_DATA, 'paths', `${p.id}.json`), p);
    index.push({ id: p.id, title: p.title, blurb: p.blurb, minutes: p.minutes, steps: p.steps.length });
  }
  writeJson(join(PUBLIC_DATA, 'paths', 'index.json'), { paths: index });
  report.stats['paths'] = index.length;
}
