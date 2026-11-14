import { buildGoFurther, keyVerse, refContext, type FurtherKind } from '../../src/curriculum/goFurther';
import { loadExtras, loadGrades, loadKnown } from './lessonData';

/**
 * Per grade: how many lessons have each field and each kind of outward link, and which links are broken.
 * Exits 1 when any lesson has a link that does not resolve.   Usage: npm run report:lessons
 */
const FIELDS = ['teach', 'talk', 'quiz', 'life', 'saint', 'saintStory', 'misc', 'mem', 'hook', 'assess', 'script', 'tryit', 'prayer', 'deeper'] as const;
const KINDS: FurtherKind[] = ['scripture', 'catechism', 'apologetics', 'library', 'track', 'chain'];

export interface GradeRow { grade: string; lessons: number; fields: Record<string, number>; links: Record<string, number>; keyVerse: number; approximate: { lesson: string; note: string }[]; broken: { lesson: string; problem: string }[] }

export function report(): GradeRow[] {
  const known = loadKnown();
  const extras = loadExtras();
  return loadGrades().map((g) => {
    const row: GradeRow = { grade: g.id, lessons: 0, fields: Object.fromEntries(FIELDS.map((f) => [f, 0])), links: Object.fromEntries(KINDS.map((k) => [k, 0])), keyVerse: 0, approximate: [], broken: [] };
    for (const l of g.units.flatMap((u) => u.lessons)) {
      row.lessons++;
      const rec = l as unknown as Record<string, unknown>;
      for (const f of FIELDS) { const v = rec[f]; if (Array.isArray(v) ? v.length : v) row.fields[f]++; }
      const r = buildGoFurther(l, known, extras[l.id]);
      for (const k of new Set(r.links.map((x) => x.kind))) row.links[k]++;
      const kv = keyVerse(l, refContext(known.editions, known.edition));
      if (kv.status === 'exact') row.keyVerse++;
      else if (kv.status === 'approximate') row.approximate.push({ lesson: l.id, note: `${kv.label}: ${kv.reason}` });
      else if (kv.status === 'invalid') row.broken.push({ lesson: l.id, problem: `key verse "${kv.label}": ${kv.reason}` });
      for (const a of r.links.filter((x) => x.kind === 'scripture' && x.note)) row.approximate.push({ lesson: l.id, note: `${a.label}: ${a.note}` });
      for (const p of r.broken) row.broken.push({ lesson: l.id, problem: p });
    }
    return row;
  });
}

export function format(rows: GradeRow[]): string {
  const cols = [...FIELDS.map((f) => `${f}`), ...KINDS.map((k) => `link:${k}`), 'keyverse'];
  const head = ['grade', 'lessons', ...cols];
  const body = rows.map((r) => [r.grade, r.lessons, ...FIELDS.map((f) => r.fields[f]), ...KINDS.map((k) => r.links[k]), r.keyVerse].map(String));
  const total = ['ALL', String(rows.reduce((a, r) => a + r.lessons, 0)), ...FIELDS.map((f) => String(rows.reduce((a, r) => a + r.fields[f], 0))), ...KINDS.map((k) => String(rows.reduce((a, r) => a + r.links[k], 0))), String(rows.reduce((a, r) => a + r.keyVerse, 0))];
  const all = [head, ...body, total];
  const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  const out = all.map((r) => r.map((c, i) => (i === 0 ? c.padEnd(w[i]) : c.padStart(w[i]))).join('  '));
  out.splice(1, 0, w.map((n) => '-'.repeat(n)).join('  '));
  return out.join('\n');
}

if (process.argv[1]?.endsWith('lesson-report.ts')) {
  const rows = report();
  console.log(format(rows));
  const approx = rows.flatMap((r) => r.approximate.map((b) => `${r.grade} ${b.lesson}: ${b.note}`));
  if (approx.length) console.log(`\n${approx.length} passage(s) whose verse numbering is not verified to match every edition (shown with a note in the app):\n` + approx.join('\n'));
  const bad = rows.flatMap((r) => r.broken.map((b) => `${r.grade} ${b.lesson}: ${b.problem}`));
  if (bad.length) { console.error(`\n${bad.length} broken link(s):\n` + bad.join('\n')); process.exit(1); }
  console.log('\nNo broken links.');
}
