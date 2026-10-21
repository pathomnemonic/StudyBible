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
  report.stats['names-index'] = { entries: n };
}
