import type { CountsEdition } from './refCheck';
import { pooledCounts, resolveRef } from './refCheck';
import type { Ref } from './refs';

export type PlanReferenceResult =
  | { ok: true; refs: Ref[] }
  | { ok: false; reason: string; ref: Ref };

/** Resolve an entire user-entered group before returning any anchors; a mixed exact/uncertain list is all-or-nothing. */
export function resolvePlanReferences(refs: Ref[], editions: CountsEdition[]): PlanReferenceResult {
  const source = pooledCounts(editions, 'english');
  const anchor = editions.find((e) => e.scheme === 'vulgate');
  if (!source || !anchor) return { ok: false, ref: refs[0] ?? { book: 'JHN', c1: 1, c2: 1 }, reason: 'Scripture verse counts are not loaded yet.' };
  const resolved: Ref[] = [];
  for (const ref of refs) {
    const result = resolveRef(source, anchor, ref, 'kjv', anchor);
    if (result.status !== 'exact' || !result.anchor) return { ok: false, ref, reason: result.reason ?? 'the verse mapping is not exact' };
    resolved.push(result.anchor);
  }
  return { ok: true, refs: resolved };
}
