import type { Chain, ChainMode, Life, Situation } from './types';

const files = import.meta.glob('../data/chains/*.json', { import: 'default' }) as Record<string, () => Promise<any[]>>;
const cache = new Map<ChainMode, Promise<Chain[]>>();

/** All chains of one kind, merged from the data files for that mode (arguments.a.json, arguments.b.json, …). */
export function loadChains(mode: ChainMode): Promise<Chain[]> {
  if (!cache.has(mode)) {
    const mine = Object.entries(files).filter(([p]) => { const f = p.split('/').pop()!; return f === `${mode}.json` || (f.startsWith(`${mode}.`) && f.endsWith('.json')); }).sort(([a], [b]) => a.localeCompare(b));
    cache.set(mode, Promise.all(mine.map(([, load]) => load())).then((parts) => parts.flat() as Chain[]));
  }
  return cache.get(mode)!;
}

const other = new Map<string, Promise<any[]>>();
function loadKind<T>(prefix: string): Promise<T[]> {
  if (!other.has(prefix)) {
    const mine = Object.entries(files).filter(([p]) => { const f = p.split('/').pop()!; return f === `${prefix}.json` || (f.startsWith(`${prefix}.`) && f.endsWith('.json')); }).sort(([a], [b]) => a.localeCompare(b));
    other.set(prefix, Promise.all(mine.map(([, load]) => load())).then((parts) => parts.flat()));
  }
  return other.get(prefix)! as Promise<T[]>;
}
export const loadSituations = () => loadKind<Situation>('situations');
export const loadLives = () => loadKind<Life>('lives');
