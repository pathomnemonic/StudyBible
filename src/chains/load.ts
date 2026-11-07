import type { Chain, ChainMode } from './types';

const files = import.meta.glob('../data/chains/*.json', { import: 'default' }) as Record<string, () => Promise<Chain[]>>;
const cache = new Map<ChainMode, Promise<Chain[]>>();

/** All chains of one kind, merged from the data files for that mode (arguments.a.json, arguments.b.json, …). */
export function loadChains(mode: ChainMode): Promise<Chain[]> {
  if (!cache.has(mode)) {
    const mine = Object.entries(files).filter(([p]) => { const f = p.split('/').pop()!; return f === `${mode}.json` || (f.startsWith(`${mode}.`) && f.endsWith('.json')); }).sort(([a], [b]) => a.localeCompare(b));
    cache.set(mode, Promise.all(mine.map(([, load]) => load())).then((parts) => parts.flat()));
  }
  return cache.get(mode)!;
}
