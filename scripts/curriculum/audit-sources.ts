// Lists what each curriculum lesson gets attached (videos, art, children's story) so a person can judge whether they fit.
// Run: npx tsx scripts/curriculum/audit-sources.ts [gradeId]
import { readFileSync } from 'node:fs';
import { parseRefs, type Ref } from '../../src/lib/refs';
import { convertRef } from '../../src/lib/versification';
import { relevant } from '../../src/curriculum/match';

const J = (p: string) => JSON.parse(readFileSync(new URL(`../../public/data/${p}`, import.meta.url), 'utf8'));
const grades: { id: string }[] = J('curriculum/index.json');
const videos: { id: string; title: string; refs: string[]; anchors?: string[]; kids?: boolean }[] = J('media/videos.json').videos;
const only = process.argv[2];
let total = 0, kept = 0;
for (const gm of grades) {
  if (only && gm.id !== only) continue;
  const g = J(`curriculum/grade-${gm.id}.json`);
  for (const u of g.units) for (const l of u.lessons) {
    const sel: Ref[] = l.scripture.split(';').flatMap((x: string) => { const p = parseRefs(x.trim()); return p.ok ? p.refs.map((r) => r.ref) : []; });
    for (const v of videos) {
      const vr: Ref[] = v.refs.flatMap((x) => { const p = parseRefs(x); return p.ok ? p.refs.map((r) => r.ref) : []; });
      if (!vr.some((a) => sel.some((s) => a.book === s.book && a.c1 <= (s.c2 ?? s.c1) && s.c1 <= (a.c2 ?? a.c1)))) continue;
      total++;
      const ok = relevant(l, v.title, v.refs.join('; '));
      if (ok) kept++;
      console.log(`${ok ? 'KEEP' : 'DROP'}  ${l.id} “${l.title}” [${l.scripture}]  ←  ${v.title} [${v.refs.join('; ')}]`);
    }
  }
}
console.error(`${kept} of ${total} video matches kept`);
void convertRef;
