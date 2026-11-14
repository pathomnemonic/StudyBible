import type { CountsEdition } from './refCheck';
import { checkRefIn, pooledCounts, resolveRef } from './refCheck';
import type { Ref } from './refs';

export type PlanReferenceResult =
  | { ok: true; refs: Ref[] }
  | { ok: false; reason: string; ref?: Ref };

/** Resolve an entire user-entered group before returning any anchors; a mixed exact/uncertain list is all-or-nothing. */
export function resolvePlanReferences(refs: Ref[], editions: CountsEdition[]): PlanReferenceResult {
  const source = pooledCounts(editions, 'english');
  const anchor = editions.find((e) => e.id === 'vulgate');
  if (!source || !anchor) return { ok: false, reason: 'Scripture verse counts are not loaded yet.' };
  const resolved: Ref[] = [];
  for (const ref of refs) {
    const result = resolveRef(source, anchor, ref, 'kjv', anchor);
    if (result.status !== 'exact' || !result.anchor) return { ok: false, ref, reason: result.reason ?? 'the verse mapping is not exact' };
    resolved.push(result.anchor);
  }
  return { ok: true, refs: resolved };
}

/** Validate already-anchor-numbered whole chapters against the canonical edition before saving a book-mode plan. */
export function validateAnchorPlanReferences(refs: Ref[], editions: CountsEdition[]): PlanReferenceResult {
  const anchor = editions.find((e) => e.id === 'vulgate');
  if (!anchor) return { ok: false, reason: 'The canonical Vulgate edition counts are not loaded yet.' };
  for (const ref of refs) {
    const issue = checkRefIn(anchor, ref);
    if (issue) return { ok: false, ref, reason: issue.reason };
  }
  return { ok: true, refs };
}
