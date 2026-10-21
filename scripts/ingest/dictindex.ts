import { join } from 'node:path';
import { readFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { PUBLIC_DATA, Report, writeJson } from './lib/util';

/**
 * Makes the dictionaries cheap to use in the browser: entries are cut into chunks of 200, and a per-book index lists which entries
 * cite which verses. The whole-file outputs of buildDictionaries are removed afterwards (they are rebuilt on every build).
 */
const CHUNK = 200;
export function buildDictIndex(report: Report) {
  const dir = join(PUBLIC_DATA, 'dictionary');
  const byBook: Record<string, number[][]> = {};
  let n = 0;
  ['easton', 'smith'].forEach((id, code) => {
    const f = join(dir, `${id}.json`);
    if (!existsSync(f)) return;
    const d = JSON.parse(readFileSync(f, 'utf8'));
    const entries: { term: string; text: string[]; aliases?: string[]; refs?: string[] }[] = d.entries;
    for (let i = 0; i < entries.length; i += CHUNK) writeJson(join(dir, `${id}-${i / CHUNK}.json`), entries.slice(i, i + CHUNK).map((e) => ({ term: e.term, text: e.text })));
    entries.forEach((e, idx) => {
      const seen = new Set<string>();
      for (const r of e.refs ?? []) {
        const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+)(?:\.(\d+))?)?$/.exec(r);
        if (!m || seen.has(r)) continue;
        seen.add(r);
        (byBook[m[1]] ??= []).push([+m[2], +m[3], +m[2], +(m[4] ?? m[3]), code, idx]);
      }
    });
    n += entries.length;
    writeJson(join(dir, `${id}-meta.json`), { source: d.source, edition: d.edition, license: d.license, url: d.url, tradition: d.tradition, count: entries.length, chunk: CHUNK });
    unlinkSync(f);
  });
  mkdirSync(join(dir, 'by-book'), { recursive: true });
  for (const [b, rows] of Object.entries(byBook)) writeJson(join(dir, 'by-book', `${b}.json`), rows);
  const nf = join(dir, 'nave.json');
  if (existsSync(nf)) {
    const nv = JSON.parse(readFileSync(nf, 'utf8'));
    const topics: { topic: string; subtopics?: { label: string }[]; see?: string[] }[] = nv.topics;
    for (let i = 0; i < topics.length; i += CHUNK) writeJson(join(dir, `nave-${i / CHUNK}.json`), topics.slice(i, i + CHUNK).map((t) => ({ topic: t.topic, see: t.see, subtopics: (t.subtopics ?? []).slice(0, 40).map((s) => s.label) })));
    writeJson(join(dir, 'nave-meta.json'), { source: nv.source, edition: nv.edition, license: nv.license, url: nv.url, count: topics.length, chunk: CHUNK });
    unlinkSync(nf);
  }
  report.stats['dictindex'] = { entries: n, books: Object.keys(byBook).length };
}
