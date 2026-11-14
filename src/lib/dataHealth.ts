/** A read-only check of the reader's own data for references that no longer lead anywhere. It reports; it never changes or deletes anything. */
import { parseRefId } from './refs';
import type { Target } from '../db/db';

export interface Finding { where: string; what: string; to?: string }
interface Rec { uid?: string; ref?: string }
export interface HealthInput {
  notes: { id?: number; uid?: string; title?: string; body: string; targets: Target[] }[];
  highlights: Rec[];
  bookmarks: Rec[];
  collections: { id?: number; name: string; items: Target[] }[];
  userPlans: { id?: number; name: string; days: { refs: string[] }[] }[];
}

export function dataHealth(d: HealthInput): Finding[] {
  const out: Finding[] = [];
  const uids = { note: new Set(d.notes.map((n) => n.uid).filter(Boolean)), highlight: new Set(d.highlights.map((h) => h.uid).filter(Boolean)), bookmark: new Set(d.bookmarks.map((b) => b.uid).filter(Boolean)) };
  for (const n of d.notes) {
    const name = n.title || n.body.split('\n')[0].slice(0, 40) || 'A note';
    for (const t of n.targets) if (t.type === 'passage' && !parseRefId(t.ref)) out.push({ where: `Note “${name}”`, what: `is attached to a passage address the app cannot read (${t.ref})`, to: n.id != null ? `/library/notes/${n.id}` : undefined });
  }
  for (const h of d.highlights) if (h.ref && !parseRefId(h.ref)) out.push({ where: 'A highlight', what: `has a passage address the app cannot read (${h.ref})` });
  for (const b of d.bookmarks) if (b.ref && !parseRefId(b.ref)) out.push({ where: 'A bookmark', what: `has a passage address the app cannot read (${b.ref})` });
  for (const c of d.collections) {
    const to = c.id != null ? `/collection/${c.id}` : undefined;
    for (const t of c.items) {
      if ((t.type === 'note' || t.type === 'highlight' || t.type === 'bookmark') && !uids[t.type].has(t.uid)) out.push({ where: `Collection “${c.name}”`, what: `holds ${t.label ? `“${t.label}”` : `a ${t.type}`} that is no longer here`, to });
      if (t.type === 'passage' && !parseRefId(t.ref)) out.push({ where: `Collection “${c.name}”`, what: `holds a passage address the app cannot read (${t.ref})`, to });
    }
  }
  for (const p of d.userPlans) {
    const bad = p.days.filter((day) => day.refs.some((r) => !parseRefId(r))).length;
    if (bad) out.push({ where: `Reading plan “${p.name}”`, what: `has ${bad} ${bad === 1 ? 'day' : 'days'} with a passage address the app cannot read`, to: p.id != null ? `/pray/plans/${encodeURIComponent('user:' + p.id)}` : undefined });
  }
  return out;
}
