import { CATS, type TQ } from './trivia';

const files = import.meta.glob('../data/trivia/*.json');

/** Every trivia question, by category: each category's main file plus any "<category>.<more>.json" beside it. Loaded on demand. */
export async function loadTriviaBank(): Promise<Record<string, TQ[]>> {
  const out: Record<string, TQ[]> = {};
  await Promise.all(CATS.map(async (c) => {
    const keys = Object.keys(files).filter((p) => { const f = p.split('/').pop()!; return f === `${c.id}.json` || (f.startsWith(`${c.id}.`) && f.endsWith('.json')); }).sort();
    const lists = await Promise.all(keys.map((k) => files[k]().then((m) => (m as { default: TQ[] }).default).catch(() => [] as TQ[])));
    out[c.id] = lists.flat();
  }));
  return out;
}
