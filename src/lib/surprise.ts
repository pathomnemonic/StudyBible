import { BOOKS } from './canon';
import { getSettings } from './store';
import { getLibraryIndex } from '../data/content';
import { PLANS, MORE_PLANS } from '../data/novenas';
import { EXTRA_PLANS } from '../data/novenas2';
import { MORE_PLANS3 } from '../data/novenas3';
import { MORE } from '../data/devotions2';
import { FEASTS } from '../data/feasts';

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** Somewhere to go: a random chapter, a work from the library, a novena, a devotion or a feast, each equally likely. */
export async function surpriseTarget(): Promise<string> {
  const kind = pick(['bible', 'work', 'novena', 'devotion', 'feast']);
  if (kind === 'work') {
    const works = (await getLibraryIndex().catch(() => null))?.works ?? [];
    if (works.length) return `/room/work/${pick(works).id}/0`;
  }
  if (kind === 'novena') return `/pray/novenas/${pick([...PLANS, ...MORE_PLANS, ...EXTRA_PLANS, ...MORE_PLANS3]).id}`;
  if (kind === 'devotion') return `/pray/devotions/${pick(MORE).id}`;
  if (kind === 'feast') return `/pray/year?feast=${pick(FEASTS).id}`;
  const b = pick(BOOKS);
  return `/read/${getSettings().defaultEdition}/${b.id}/${1 + Math.floor(Math.random() * b.chapters)}`;
}
