import { getJson } from '../data/loader';
import { parseRefs, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';

interface Idx { paths: { id: string; title: string }[] }
interface PathFile { steps: { title: string; ref: string }[] }
export interface PathHit { id: string; title: string; step: number }

let cache: Promise<{ id: string; title: string; step: number; r: Ref }[]> | null = null;
const load = () => (cache ??= getJson<Idx>('paths/index.json', true).then(async (idx) => {
  const out: { id: string; title: string; step: number; r: Ref }[] = [];
  for (const p of idx?.paths ?? []) {
    const f = await getJson<PathFile>(`paths/${p.id}.json`, true).catch(() => null);
    f?.steps.forEach((s, i) => {
      const x = parseRefs(s.ref);
      if (x.ok) out.push({ id: p.id, title: p.title, step: i, r: convertRef('kjv', 'vulgate', x.refs[0].ref).ref });
    });
  }
  return out;
}).catch(() => []));

/** Study paths with a step in the chapter(s) of this selection (anchor numbering). */
export async function pathsFor(sel: Ref[]): Promise<PathHit[]> {
  const all = await load();
  const seen = new Set<string>();
  const out: PathHit[] = [];
  for (const h of all) {
    if (seen.has(h.id)) continue;
    if (sel.some((s) => s.book === h.r.book && s.c1 <= h.r.c2 && h.r.c1 <= s.c2)) { seen.add(h.id); out.push({ id: h.id, title: h.title, step: h.step }); }
  }
  return out;
}
